// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase.sol";
import "@rarible/exchange-v2/contracts/lib/LibTransfer.sol";
import "@rarible/exchange-v2/contracts/TransferManagerHelper.sol";

//contract AuctionHouse is AuctionHouseBase, Initializable, TransferExecutor {
contract AuctionHouse is AuctionHouseBase, Initializable, TransferExecutor, TransferManagerHelper {
    using LibTransfer for address;

    mapping(uint => Auction) public auctions;   //save auctions here

    uint256 private auctionId;          //unic. auction id
    address private nftTransferProxy;
    address private erc20TransferProxy;

    uint256 private constant EXTENSION_DURATION = 15 minutes;
    uint256 private constant MAX_DURATION = 1000 days;

    function __AuctionHouse_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        _initializeAuctionId();
        __TransferHelper_init_unchained(newProtocolFee, newDefaultFeeReceiver);
        nftTransferProxy = address(_transferProxy);
        erc20TransferProxy = address(_erc20TransferProxy);
    }

    //creates auction and locks assets to sell
    function startAuction(
        LibAsset.Asset memory _sellAsset,
        LibAsset.AssetType memory _buyAsset,
        uint endTime,
        uint minimalStep,
        uint minimalPrice,
        bytes4 dataType,
        bytes memory data
    ) public {
        uint currentAuctionId = getNextAndIncrementAuctionId();
        require(_sellAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "can't sell ETH on auction");
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);
        (uint startTimeCalculate, uint endTimeCalculate) = setTimeRange(aucData.startTime, endTime, aucData.duration);
        auctions[currentAuctionId] = Auction(
            _sellAsset,
            _buyAsset,
            Bid(0, "", ""),
            _msgSender(),
            payable(address(0)),
            startTimeCalculate,
            endTimeCalculate,
            minimalStep,
            minimalPrice,
            0,
            dataType,
            data
        );
        transfer(_sellAsset, _msgSender(), address(this), TO_LOCK, LOCK);
        setApproveForTransferProxy(_sellAsset);
        emit AuctionCreated(currentAuctionId, auctions[currentAuctionId]);
    }

    function setTimeRange(uint _startTime, uint _endTime, uint _duration) internal returns (uint startTime, uint endTime){
        if (_startTime == 0) {
            startTime = block.timestamp;
        } else {
            startTime = _startTime;
        }
        if (_endTime == 0) {
            require(_duration >= EXTENSION_DURATION && _duration <= MAX_DURATION, "wrong auction duration");
            endTime = startTime + _duration;
        } else {
            endTime = _endTime;
        }
        require(endTime > startTime, "error in auction time range");
    }

    function setApproveForTransferProxy(LibAsset.Asset memory _asset) internal {
        if (_asset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            (address token) = abi.decode(_asset.assetType.data, (address));
            IERC20Upgradeable(token).approve(erc20TransferProxy, _asset.value);
        } else if (_asset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            (address token, uint tokenId) = abi.decode(_asset.assetType.data, (address, uint256));
            require(_asset.value == 1, "erc721 value error");
            IERC721Upgradeable(token).setApprovalForAll(nftTransferProxy, true);
        } else if (_asset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            (address token,) = abi.decode(_asset.assetType.data, (address, uint256));
            IERC1155Upgradeable(token).setApprovalForAll(nftTransferProxy, true);
        }
    }

    function _initializeAuctionId() internal {
        auctionId = 1;
    }

    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    //put a bid and return locked assets for the last bid
    function putBid(uint _auctionId, Bid memory bid) payable external {
        require(checkAuctionExistence(_auctionId), "there is no auction with this id");
        require(checkAuctionRangeTime(_auctionId), "current time out of  auction time range");//TODO check time range

        address payable newBuyer = _msgSender();
        uint newAmount = bid.amount;
        if (buyOutVerify(_auctionId, newAmount)) {
            _buyOut(_auctionId, bid);
            doTransfers(_auctionId);
            deactivateAuction(_auctionId);
            emit AuctionBuyOut(_auctionId);
            return;
        }
        Auction storage currentAuction = auctions[_auctionId];
        uint currentTime = block.timestamp;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);

        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            require(newAmount >= currentAuction.minimalPrice, "bid can't be less than minimal price");
            currentAuction.endTime = currentTime + aucData.duration;
        } else {//there is bid in auction
            require(currentAuction.endTime >= currentTime, "auction is over");
            require(currentAuction.buyer != newBuyer, "already have an outstanding bid");
            uint256 minAmount = getMinimalNextBid(_auctionId);
            require(newAmount >= minAmount, "bid amount too low");
        }
        reserveValue(currentAuction.buyAsset, currentAuction.buyer, newBuyer, currentAuction.lastBid.amount, newAmount);
        currentAuction.lastBid = bid;
        currentAuction.buyer = newBuyer;
        //extend auction if time left < EXTENSION_DURATION
        if (currentAuction.endTime - currentTime < EXTENSION_DURATION) {
            currentAuction.endTime = currentTime + EXTENSION_DURATION;
        }
        emit BidPlaced(_auctionId, bid, currentAuction.endTime);
    }

    function reserveValue(LibAsset.AssetType memory _buyAssetType, address oldBuyer, address newBuyer, uint oldAmount, uint newAmount) internal {
        LibAsset.Asset memory transferAsset;
        if (oldBuyer != address(0x0)) {//return oldAmount to oldBuyer
            transferAsset = makeAsset(_buyAssetType, oldAmount);
            transfer(transferAsset, address(this), oldBuyer, TO_LOCK, UNLOCK);
        }
        transferAsset = makeAsset(_buyAssetType, newAmount);
        if (transferAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (msg.value > newAmount) {//more ETH than need
                address(newBuyer).transferEth(msg.value - newAmount);
            }
        } else if (transferAsset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            transfer(transferAsset, newBuyer, address(this), TO_LOCK, LOCK);
            (address token) = abi.decode(_buyAssetType.data, (address));
            IERC20Upgradeable(token).approve(erc20TransferProxy, newAmount);
        } else if (transferAsset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            transfer(transferAsset, newBuyer, address(this), TO_LOCK, LOCK);
            (address token,) = abi.decode(_buyAssetType.data, (address, uint256));
            IERC1155Upgradeable(token).setApprovalForAll(nftTransferProxy, true);
        } else if (transferAsset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            transfer(transferAsset, newBuyer, address(this), TO_LOCK, LOCK);
            (address token,) = abi.decode(_buyAssetType.data, (address, uint256));
            IERC721Upgradeable(token).setApprovalForAll(nftTransferProxy, true);
        }
    }

    function makeAsset(LibAsset.AssetType memory _assetType, uint amount) internal returns (LibAsset.Asset memory _asset) {
        _asset.assetType = _assetType;
        _asset.value = amount;
        return _asset;
    }

    function getMinimalNextBid(uint _auctionId) internal view returns (uint minBid){
        Auction storage currentAuction = auctions[_auctionId];
        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount + currentAuction.minimalStep;
        }
    }

    function checkAuctionExistence(uint _auctionId) internal view returns (bool){
        if (auctions[_auctionId].seller == address(0)) {
            return false;
        } else {
            return true;
        }
    }

    function buyOutVerify(uint _auctionId, uint newAmount) internal returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        if (aucData.buyOutPrice <= newAmount) {
            return true;
        }
        return false;
    }
    //finishAuction
    function finishAuction(uint _auctionId) payable public {
        require(checkAuctionExistence(_auctionId), "there is no auction with this id");
        require(!checkAuctionRangeTime(_auctionId), "current time in auction time range");
        doTransfers(_auctionId);
        deactivateAuction(_auctionId);
        emit AuctionFinished(_auctionId);
    }

    function doTransfers(uint _auctionId) internal {
        Auction storage currentAuction = auctions[_auctionId];
        address seller = currentAuction.seller;
        address buyer = currentAuction.buyer;
        if (buyer != address(0x0)) {//bid exists
            (uint rest, uint restNft)  = transferAllFees(_auctionId);
            //transfer fee
            transferAmount(currentAuction.buyAsset, address(this), seller, rest, TO_SELLER, PAYOUT);
            //
            if (currentAuction.sellAsset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS
                || currentAuction.sellAsset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
                currentAuction.sellAsset.value = restNft;
            }
            transfer(currentAuction.sellAsset, address(this), buyer, TO_BIDDER, PAYOUT);
            //nft to buyer
        } else {
            transfer(currentAuction.sellAsset, address(this), seller, TO_SELLER, UNLOCK);
            //nft back to seller
        }
    }

    function transferAllFees(uint _auctionId) internal returns (uint rest, uint restNft) {
        Auction storage currentAuction = auctions[_auctionId];
        address seller = currentAuction.seller;
        uint amount = currentAuction.lastBid.amount;
        rest = transferProtocolFee(amount, amount, address(this), currentAuction.buyAsset, TO_LOCK);
        restNft = currentAuction.sellAsset.value;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        LibPart.Part[] memory auctionFees = aucData.originFees;
        uint totalFees;
        (rest, totalFees) = transferFees(currentAuction.buyAsset, rest, amount, auctionFees, address(this), TO_SELLER, ROYALTY);
        require(totalFees <= 5000, "Auction fees are too high (>50%)");
        if (currentAuction.sellAsset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS
            || currentAuction.sellAsset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            LibBidDataV1.DataV1 memory bidData = LibBidDataV1.parse(currentAuction.lastBid.data, currentAuction.lastBid.dataType);
            LibPart.Part[] memory bidFees = bidData.originFees;
            (restNft, totalFees) = transferFees(currentAuction.sellAsset.assetType, restNft, restNft, bidFees, address(this), TO_BIDDER, ROYALTY);
            require(totalFees <= 5000, "Bid fees are too high (>50%)");
        }
    }

    function checkAuctionRangeTime(uint _auctionId) internal view returns (bool){
        uint currentTime = block.timestamp;
        Auction storage currentAuction = auctions[_auctionId];
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        if ((currentTime >= aucData.startTime) && (currentTime <= currentAuction.endTime)) {
            return true;
        }
        return false;
    }

    function deactivateAuction(uint _auctionId) internal {
        auctions[_auctionId].seller == address(0);
    }

    function transferAmount(LibAsset.AssetType memory _assetType, address from, address to, uint amount, bytes4 _direction, bytes4 _type) internal {
        LibAsset.Asset memory _asset;
        _asset.assetType = _assetType;
        _asset.value = amount;
        transfer(_asset, from, to, _direction, _type);
    }

    //cancel auction without bid
    function cancel(uint _auctionId) public {
        require(checkAuctionExistence(_auctionId), "there is no auction with this id");
        Auction storage currentAuction = auctions[_auctionId];
        address seller = currentAuction.seller;
        require(seller == _msgSender(), "auction owner not detected");
        address buyer = currentAuction.buyer;
        uint amount = currentAuction.lastBid.amount;
        if (buyer == address(0x0)) {//no bid at all
            transfer(currentAuction.sellAsset, address(this), seller, TO_SELLER, UNLOCK);
            //nft back to seller
            deactivateAuction(_auctionId);
            emit AuctionCancelled(_auctionId);
        }
    }

    //buyout
    function buyOut(uint _auctionId, Bid memory bid) public payable {
        require(checkAuctionExistence(_auctionId), "there is no auction with this id");
        require(checkAuctionRangeTime(_auctionId), "current time out of  auction time range");
        uint newAmount = bid.amount;
        require(buyOutVerify(_auctionId, newAmount), "not enough for buyout auction");
        _buyOut(_auctionId, bid);
        doTransfers(_auctionId);
        deactivateAuction(_auctionId);
        emit AuctionBuyOut(_auctionId);
    }

    function _buyOut(uint _auctionId, Bid memory bid)  internal {
        address payable newBuyer = _msgSender();
        Auction storage currentAuction = auctions[_auctionId];
        uint newAmount = bid.amount;
        reserveValue(currentAuction.buyAsset, currentAuction.buyer, newBuyer, currentAuction.lastBid.amount, newAmount);
        currentAuction.lastBid = bid;
        currentAuction.buyer = newBuyer;
    }

    uint256[50] private ______gap;
}