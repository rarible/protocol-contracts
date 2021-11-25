// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase.sol";

import "@rarible/exchange-v2/contracts/lib/LibTransfer.sol";
import "@rarible/exchange-v2/contracts/RaribleTransferManager.sol";

/// @dev contract to create and interact with auctions 
contract AuctionHouse is AuctionHouseBase, TransferExecutor,  RaribleTransferManager{
    using LibTransfer for address;

    /// @dev mapping to store data of auctions for auctionId
    mapping(uint => Auction) auctions;

    /// @dev latest auctionId
    uint256 private auctionId;          //unic. auction id

    /// @dev minimal auction duration and also the time for that auction is extended when it's about to end (endTime - now < EXTENSION_DURATION)
    uint256 private constant EXTENSION_DURATION = 15 minutes;

    /// @dev maximum auction duration
    uint256 private constant MAX_DURATION = 1000 days;

    function __AuctionHouse_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver, newRoyaltiesProvider);
        __AuctionHouseBase_init();
        __AuctionHouse_init_unchained();
    }

     function __AuctionHouse_init_unchained() internal initializer {
        auctionId = 1;
    }

    /// @dev creates an auction and locks sell asset
    function startAuction(
        LibAsset.Asset memory _sellAsset,
        LibAsset.AssetType memory _buyAsset,
        uint minimalStep,
        uint minimalPrice,
        bytes4 dataType,
        bytes memory data
    ) external {
        // ETH or ERC20 can't be a sell item
        require(
            _sellAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS && 
            _sellAsset.assetType.assetClass != LibAsset.ERC20_ASSET_CLASS,
            "can't sell ETH or ERC20 on auction"
        );

        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);
        require(aucData.duration >= EXTENSION_DURATION && aucData.duration <= MAX_DURATION, "incorrect duration");

        uint endTime = 0;
        if (aucData.startTime > 0){
            require (aucData.startTime >= block.timestamp, "incorrect start time");
            endTime = aucData.startTime + aucData.duration;
        }
        uint currentAuctionId = getNextAndIncrementAuctionId();
        auctions[currentAuctionId] = Auction(
            _sellAsset,
            _buyAsset,
            Bid(0, "", ""),
            _msgSender(),
            payable(address(0)),
            endTime,
            minimalStep,
            minimalPrice,
            protocolFee,
            dataType,
            data
        );
        transfer(_sellAsset, _msgSender(), address(this), TO_LOCK, LOCK);
        setApproveForTransferProxy(_sellAsset);

        setAuctionForToken(_sellAsset, currentAuctionId);
        emit AuctionCreated(currentAuctionId, auctions[currentAuctionId]);
    }

    /// @dev sets approval for transfer proxy to transfer sell asset from this contract
    function setApproveForTransferProxy(LibAsset.Asset memory _asset) internal {
        if (_asset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            (address token) = abi.decode(_asset.assetType.data, (address));
            IERC20Upgradeable(token).approve(proxies[LibAsset.ERC20_ASSET_CLASS], _asset.value);
        } else if (_asset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            (address token,) = abi.decode(_asset.assetType.data, (address, uint256));
            require(_asset.value == 1, "erc721 value error");
            IERC721Upgradeable(token).setApprovalForAll(proxies[LibAsset.ERC721_ASSET_CLASS], true);
        } else if (_asset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            (address token,) = abi.decode(_asset.assetType.data, (address, uint256));
            IERC1155Upgradeable(token).setApprovalForAll(proxies[LibAsset.ERC1155_ASSET_CLASS], true);
        }
    }

    /// @dev increments auctionId and returns new value
    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    /// @dev put a bid and return locked assets for the last bid
    function putBid(uint _auctionId, Bid memory bid) payable public {
        checkAuctionInProgress(_auctionId);
        address payable newBuyer = _msgSender();
        uint newAmount = bid.amount;
        if (buyOutVerify(_auctionId, newAmount)) {
            _buyOut(_auctionId, bid);
            doTransfers(_auctionId);
            deactivateAuction(_auctionId);
            return;
        }
        
        Auction memory currentAuction = auctions[_auctionId];
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        uint currentTime = block.timestamp;
        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            // set endTime if it's not set
            if (currentAuction.endTime == 0){
                auctions[_auctionId].endTime = currentTime + aucData.duration;
            }
            require(newAmount >= currentAuction.minimalPrice, "bid can't be less than minimal price");
        } else {//there is bid in auction
            require(currentAuction.buyer != newBuyer, "already have an outstanding bid");
            uint256 minAmount = getMinimalNextBid(_auctionId);
            require(newAmount >= minAmount, "bid amount too low");
        }
        reserveValue(
            currentAuction.buyAsset, 
            currentAuction.buyer, 
            newBuyer, 
            getBidTotalAmount(currentAuction.lastBid, currentAuction.protocolFee), 
            getBidTotalAmount(bid, currentAuction.protocolFee)
        );
        auctions[_auctionId].lastBid = bid;
        auctions[_auctionId].buyer = newBuyer;

        // extends auction time if it about to end
        if (currentAuction.endTime - currentTime < EXTENSION_DURATION) {
            auctions[_auctionId].endTime = currentTime + EXTENSION_DURATION;
        }
        emit BidPlaced(_auctionId, newBuyer, bid, auctions[_auctionId].endTime);
    }

    /// @dev reserves new bid and returns the last one if it exists
    function reserveValue(LibAsset.AssetType memory _buyAssetType, address oldBuyer, address newBuyer, uint oldAmount, uint newAmount) internal {
        LibAsset.Asset memory transferAsset;
        if (oldBuyer != address(0x0)) {//return oldAmount to oldBuyer
            transferAsset = LibAsset.Asset(_buyAssetType, oldAmount);
            transfer(transferAsset, address(this), oldBuyer, TO_LOCK, UNLOCK);
        }
        transferAsset = LibAsset.Asset(_buyAssetType, newAmount);
        if (transferAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (msg.value > newAmount) {//more ETH than need
                address(newBuyer).transferEth(msg.value - newAmount);
            }
        } else {
            transfer(transferAsset, newBuyer, address(this), TO_LOCK, LOCK);
            setApproveForTransferProxy(transferAsset);
        } 
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function getMinimalNextBid(uint _auctionId) public view returns (uint minBid){
        Auction storage currentAuction = auctions[_auctionId];

        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount + currentAuction.minimalStep;
        }
    }

    /// @dev returns true if auction exists, false otherwise
    function checkAuctionExistence(uint _auctionId) public view returns (bool){
        return auctions[_auctionId].seller != address(0);
    }

    /// @dev returns true if newAmount is enough for buyOut
    function buyOutVerify(uint _auctionId, uint newAmount) internal view returns (bool) {
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(auctions[_auctionId].data, auctions[_auctionId].dataType);

        if (aucData.buyOutPrice > 0 && aucData.buyOutPrice <= newAmount) {
            return true;
        }
        return false;
    }

    /// @dev finishes, deletes and transfers all assets for an auction if it's ended (it exists, it has at least one bid, now > endTme)
    function finishAuction(uint _auctionId) external {
        require(checkAuctionExistence(_auctionId), "there is no auction with this id");
        require(
            !checkAuctionRangeTime(_auctionId) &&
            auctions[_auctionId].buyer != address(0),
            "only ended auction with bid can be finished");
        doTransfers(_auctionId);
        deactivateAuction(_auctionId);
    }

    /// @dev transfers auction assets (sellAsset to buyer, buyAsset to seller)
    function doTransfers(uint _auctionId) internal {
        Auction memory currentAuction = auctions[_auctionId];
        address seller = currentAuction.seller;
        address buyer = currentAuction.buyer;
        if (buyer != address(0x0)) {//bid exists
            LibOrderDataV2.DataV2 memory bidData = LibBidDataV1.getPaymentData(currentAuction.lastBid.data, currentAuction.lastBid.dataType);
            if (bidData.payouts.length == 0){
                LibPart.Part[] memory payout = new LibPart.Part[](1);
                payout[0].account = payable(buyer);
                payout[0].value = 10000;
                bidData.payouts = payout;
            }
            LibOrderDataV2.DataV2 memory aucData = LibAucDataV1.getPaymentData(currentAuction.data, currentAuction.dataType);
            if (aucData.payouts.length == 0){
                LibPart.Part[] memory payout = new LibPart.Part[](1);
                payout[0].account = payable(seller);
                payout[0].value = 10000;
                aucData.payouts = payout;
            }
            doTransfersWithFees(
                currentAuction.lastBid.amount, 
                address(this), 
                MatchFees(currentAuction.protocolFee, currentAuction.protocolFee, LibFeeSide.FeeSide.TAKE),
                bidData, 
                aucData, 
                currentAuction.buyAsset, 
                currentAuction.sellAsset.assetType, 
                TO_MAKER
            );
            transferPayouts(currentAuction.sellAsset.assetType, currentAuction.sellAsset.value, address(this), bidData.payouts, TO_TAKER);
        } else {
            transfer(currentAuction.sellAsset, address(this), seller, TO_SELLER, UNLOCK); //nft back to seller
        }
    }

    /// @dev returns true if auction started and hasn't finished yet, false otherwise
    function checkAuctionRangeTime(uint _auctionId) public view returns (bool){
        uint currentTime = block.timestamp;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(auctions[_auctionId].data, auctions[_auctionId].dataType);
        if (aucData.startTime > 0 && aucData.startTime > currentTime) {
            return false;
        }
        uint endTime = auctions[_auctionId].endTime;
        if (endTime > 0 && endTime < currentTime){
            return false;
        }
        
        return true;
    }

    /// @dev deletes auction after finalizing
    function deactivateAuction(uint _auctionId) internal {
        emit AuctionFinished(_auctionId, auctions[_auctionId]);
        deleteAuctionForToken(auctions[_auctionId].sellAsset);
        delete auctions[_auctionId];
    }

    /// @dev cancels existing auction without bid
    function cancel(uint _auctionId) external {
        require(checkAuctionExistence(_auctionId), "there is no auction with this id");
        Auction storage currentAuction = auctions[_auctionId];
        address seller = currentAuction.seller;
        require(seller == _msgSender(), "auction owner not detected");
        address buyer = currentAuction.buyer;
        require(buyer == address(0), "can't cancel auction with bid");
        transfer(currentAuction.sellAsset, address(this), seller, TO_SELLER, UNLOCK); //nft transfer back to seller
        deactivateAuction(_auctionId);
        AuctionCancelled(_auctionId);
    }

    /// @dev buyout auction if bid satisfies buyout condition
    function buyOut(uint _auctionId, Bid memory bid) external payable {
        checkAuctionInProgress(_auctionId);

        require(buyOutVerify(_auctionId, bid.amount), "not enough for buyout auction");
        _buyOut(_auctionId, bid);
        doTransfers(_auctionId);
        deactivateAuction(_auctionId);
    }

    /// @dev makes buyout bid the current bid
    function _buyOut(uint _auctionId, Bid memory bid) internal {
        address payable newBuyer = _msgSender();
        Auction storage currentAuction = auctions[_auctionId];
        reserveValue(
            currentAuction.buyAsset, 
            currentAuction.buyer, 
            newBuyer, 
            getBidTotalAmount(currentAuction.lastBid, currentAuction.protocolFee), 
            getBidTotalAmount(bid, currentAuction.protocolFee)
        );
        currentAuction.lastBid = bid;
        currentAuction.buyer = newBuyer;
    }

    /// @dev returns current highest bidder for an auction
    function getCurrentBuyer(uint _auctionId) public view returns(address) {
        return auctions[_auctionId].buyer;
    }

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(uint _auctionId) internal view{
        require(checkAuctionExistence(_auctionId) && checkAuctionRangeTime(_auctionId), "auction is inactive");
    }

    /// @dev returns true if auction doesn't exist or already finished, false otherwise
    function isFinalized(uint256 _auctionId) public view returns (bool){
        return auctions[_auctionId].seller == address(0);
    }

    /// @dev returns total amount for a bid (protocol fee and bid origin fees included)
    function getBidTotalAmount(Bid memory bid, uint _protocolFee) internal pure returns(uint){
        return calculateTotalAmount(bid.amount, _protocolFee, LibBidDataV1.getOrigin(bid.data, bid.dataType));
    }

    /// @dev function to call from wrapper to put bid
    function putBidWrapper(uint256 _auctionId) external payable {
      require(auctions[_auctionId].buyAsset.assetClass == LibAsset.ETH_ASSET_CLASS, "only ETH bids allowed");
      putBid(_auctionId, Bid(msg.value, "", ""));
    }

    uint256[50] private ______gap;
}