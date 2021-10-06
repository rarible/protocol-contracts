// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase.sol";

contract AuctionHouse is AuctionHouseBase, Initializable, OwnableUpgradeable, TransferExecutor {
    mapping(uint => Auction) public auctions;   //save auctions here

    uint256 private auctionId;          //unic. auction id
    address payable public wallet;      //to reserve ETH
    address private nftTransferProxy;
    address private erc20TransferProxy;

    uint256 private constant EXTENSION_DURATION = 15 minutes;
    uint256 private constant MAX_DURATION = 1000 days;

    function __AuctionHouse_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        _initializeAuctionId();
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
        uint currenAuctionId = getNextAndIncrementAuctionId();
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);

        require(_sellAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "can't sell ETH on auction");

        auctions[currenAuctionId] = Auction(
            _sellAsset,
            _buyAsset,
            Bid(0, "", ""),
            _msgSender(),
            payable(address(0)),
            endTime,
            minimalStep,
            minimalPrice,
            0,
            dataType,
            data
        );
        //if no endTime, duration must be set
        // if we now start time and end time 
        if (endTime == 0) {
            require(aucData.duration >= EXTENSION_DURATION && aucData.duration <= MAX_DURATION, "wrong auction duration");

            if (aucData.startTime > 0) {
                auctions[currenAuctionId].endTime = aucData.startTime + aucData.duration;
            }
        }
        transfer(_sellAsset, _msgSender(), address(this), TO_LOCK, LOCK);
        setApproveForTransferProxy(_sellAsset);
        emit AuctionCreated(currenAuctionId, auctions[currenAuctionId]);
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

    function setEthAddress(address payable _addr) public {
        wallet = _addr;
    }

    function _initializeAuctionId() internal {
        auctionId = 1;
    }

    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    //put a bid and return locked assets for the last bid--------------------------------------RPC-94
    function putBid(uint _auctionId, Bid memory bid) payable external {
        require(checkAuctionExistance(_auctionId), "there is no auction with this id");
        address payable newBuyer = _msgSender();
        uint newAmount = bid.amount;
        if (buyOutVerify(_auctionId, newAmount)) {
            //set auction finished
        }
        Auction storage currentAuction = auctions[_auctionId];
        uint currentTime = block.timestamp;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);

        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            require(newAmount >= currentAuction.minimalPrice, "bid can't be less than minimal price");
            currentAuction.endTime = currentTime + aucData.duration;
        } else {    //there is bid in auction
            require(currentAuction.endTime >= currentTime, "NFTMarketReserveAuction: Auction is over");
            require(currentAuction.buyer != newBuyer, "NFTMarketReserveAuction: You already have an outstanding bid");
            uint256 minAmount = getMinimalNextBid(_auctionId);
            require(newAmount >= minAmount, "NFTMarketReserveAuction: Bid amount too low");
        }
        reserveValue(currentAuction.buyAsset, currentAuction.buyer, newBuyer, currentAuction.lastBid.amount, newAmount);
        currentAuction.lastBid.amount = newAmount;
        currentAuction.buyer = newBuyer;
        //extend auction if time left < EXTENSION_DURATION
        if (currentAuction.endTime - currentTime < EXTENSION_DURATION) {
            currentAuction.endTime = currentTime + EXTENSION_DURATION;
        }
        emit BidPlaced(_auctionId);
    }

    function saveBid(Auction memory _auction, address payable newBuyer, uint amount) internal {
        reserveValue(_auction.buyAsset, _auction.buyer, newBuyer, _auction.lastBid.amount, amount);
        _auction.lastBid.amount = amount;
        _auction.buyer = newBuyer;
    }

    function reserveValue(LibAsset.AssetType memory _buyAssetType, address oldBuyer, address newBuyer, uint oldAmount, uint newAmount) internal {
        if (oldBuyer != address(0x0)) {
            //return reserved to oldBuyer
            LibAsset.Asset memory returnAsset;
            returnAsset.assetType = _buyAssetType;
            returnAsset.value = oldAmount;
            if ((returnAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) && (returnAsset.value == 10)) {
                transfer(returnAsset, address(0x0), oldBuyer, TO_LOCK, UNLOCK);
            } else {
                transfer(returnAsset, address(this), oldBuyer, TO_LOCK, UNLOCK);
            }
        }
        //send reserved to contract
        LibAsset.Asset memory reservedAsset;
        reservedAsset.assetType = _buyAssetType;
        //        reservedAsset.value = newAmount - oldAmount; TODO do it, now spend more ether than need
        //todo use function to transfer ether, which send ether back, when ether more, than need
        reservedAsset.value = newAmount;
        if (reservedAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            transfer(reservedAsset, address(0x0), wallet, TO_LOCK, LOCK);
        } else if (reservedAsset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            transfer(reservedAsset, newBuyer, address(this), TO_LOCK, LOCK);
            (address token) = abi.decode(_buyAssetType.data, (address));
            IERC20Upgradeable(token).approve(erc20TransferProxy, newAmount);
        }
    }

    function transferAmount(LibAsset.AssetType memory _assetType, address from, address to, uint amount, bytes4 _direction, bytes4 _type) internal {
        LibAsset.Asset memory _asset;
        _asset.assetType = _assetType;
        _asset.value = amount;
        transfer(_asset, from, to, _direction, _type);
    }

    function getMinimalNextBid(uint _auctionId) internal view returns (uint){
        Auction storage currentAuction = auctions[_auctionId];
        if (currentAuction.buyer == address(0x0)) {
            return (currentAuction.minimalPrice);
        } else {
            return (currentAuction.lastBid.amount + currentAuction.minimalStep);
        }
    }

    function checkAuctionExistance(uint _auctionId) internal view returns (bool){
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

    uint256[50] private ______gap;
}