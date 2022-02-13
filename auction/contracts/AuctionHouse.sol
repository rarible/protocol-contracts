// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionTransferExecutor.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

/// @dev contract to create and interact with auctions
contract AuctionHouse is AuctionTransferExecutor {
    using LibTransfer for address;
    using SafeMathUpgradeable for uint128;

    /// @dev default minimal auction duration and also the time for that auction is extended when it's about to end (endTime - now < EXTENSION_DURATION)
    uint128 private constant EXTENSION_DURATION = 15 minutes;

    /// @dev maximum auction duration
    uint128 private constant MAX_DURATION = 1000 days;

    /// @dev mapping to store data of auctions for auctionId
    mapping(uint => Auction) auctions;

    /// @dev mapping to store eth amount that is ready to be withdrawn (used for faulty eth-bids)
    mapping(address => uint) readyToWithdraw;

    /// @dev latest auctionId
    uint256 public auctionId;

    /// @dev minimal auction duration
    uint128 public minimalDuration;

    /// @dev current protocol fee
    uint128 public protocolFee;

    function __AuctionHouse_init(
        ITransferManager _transferManager,
        uint128 _protocolFee
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC1155Receiver_init_unchained();
        __ReentrancyGuard_init_unchained();
        __AuctionHouseBase_init_unchained();
        __AuctionHouse_init_unchained(_protocolFee);
        __AuctionTransferExecutor_init_unchained(_transferManager);
    }

    function __AuctionHouse_init_unchained(
        uint128 _protocolFee
    ) internal initializer {
        auctionId = 1;
        protocolFee = _protocolFee;
        minimalDuration = EXTENSION_DURATION;
    }

    /// @dev creates an auction and locks sell asset
    function startAuction(
        SellAsset memory _sellAsset,
        address _buyAsset,
        uint128 minimalStep,
        uint128 minimalPrice,
        bytes4 dataType,
        bytes memory data
    ) external {
        //todo: check if token contract supports ERC721 interface?

        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);
        require(aucData.duration >= minimalDuration && aucData.duration <= MAX_DURATION, "incorrect duration");

        uint128 endTime = 0;
        if (aucData.startTime > 0){
            require (aucData.startTime >= block.timestamp, "incorrect start time");
            endTime = aucData.startTime + aucData.duration;
        }

        uint currentAuctionId = getNextAndIncrementAuctionId();
        address payable sender = _msgSender();
        Auction memory auc = Auction(
            _sellAsset,
            _buyAsset,
            Bid(0, "", ""),
            sender,
            payable(address(0)),
            endTime,
            minimalStep,
            minimalPrice,
            protocolFee,
            dataType,
            data
        );
        auctions[currentAuctionId] = auc;
        transferNFT(
            _sellAsset,
            sender,
            address(this),
            TO_LOCK,
            LOCK
        );
        setAuctionForToken(_sellAsset.token, _sellAsset.tokenId, currentAuctionId);
        
        emit AuctionCreated(currentAuctionId, auc);
    }

    /// @dev increments auctionId and returns new value
    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    /// @dev put a bid and return locked assets for the last bid
    function putBid(uint _auctionId, Bid memory bid) payable public nonReentrant {
        address payable newBuyer = _msgSender();
        uint newAmount = bid.amount;
        Auction memory currentAuction = auctions[_auctionId];
        uint128 endTime = currentAuction.endTime;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        LibPart.Part memory bidOriginFee = LibBidDataV1.parse(bid.data, bid.dataType).originFee;
        uint totalAmount = calculateTotalAmount(
            bid.amount, 
            currentAuction.protocolFee, 
            bidOriginFee
        );
        if (currentAuction.buyAsset == address(0)) {
            checkEthReturnChange(totalAmount, newBuyer);
        }
        checkAuctionInProgress(currentAuction, aucData);
        if (buyOutVerify(aucData, newAmount)) {
            _buyOut(
                currentAuction,
                bid,
                aucData,
                _auctionId,
                bidOriginFee,
                totalAmount,
                newBuyer
            );
            return;
        }
        
        uint128 currentTime = uint128(block.timestamp);
        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            // set endTime if it's not set
            if (currentAuction.endTime == 0){
                endTime = currentTime + aucData.duration;
                auctions[_auctionId].endTime = endTime;
                currentAuction.endTime = endTime;
                
            }
            require(newAmount >= currentAuction.minimalPrice, "bid too small");
        } else {//there is bid in auction
            require(currentAuction.buyer != newBuyer, "already winning bid");
            uint256 minAmount = _getMinimalNextBid(currentAuction);
            require(newAmount >= minAmount, "bid too low");
        }

        address proxy = _getProxy(currentAuction.buyAsset);
        reserveBid(
            currentAuction.buyAsset,
            currentAuction.protocolFee,
            currentAuction.buyer,
            newBuyer,
            currentAuction.lastBid,
            proxy,
            totalAmount
        );
        auctions[_auctionId].lastBid = bid;
        auctions[_auctionId].buyer = newBuyer;

        // auction is extended for EXTENSION_DURATION or minimalDuration if (minimalDuration < EXTENSION_DURATION)
        uint128 minDur = minimalDuration;
        uint128 extension = (minDur < EXTENSION_DURATION) ? minDur : EXTENSION_DURATION;

        // extends auction time if it's about to end
        if (endTime.sub(currentTime) < extension) {
            endTime = currentTime + extension;
            auctions[_auctionId].endTime = endTime;
        }
        emit BidPlaced(_auctionId, newBuyer, bid, endTime);
    }

    /// @dev reserves new bid and returns the last one if it exists
    function reserveBid(
        address buyAsset,
        uint128 curProtocolFee,
        address oldBuyer,
        address newBuyer,
        Bid memory oldBid,
        address proxy,
        uint newTotalAmount
    ) internal {
        // return old bid if theres any
        _returnBid(
            oldBid,
            buyAsset,
            oldBuyer,
            curProtocolFee,
            proxy
        );
        
        //lock new bid
        transferBid(
            newTotalAmount,
            buyAsset,
            newBuyer,
            address(this),
            proxy,
            TO_LOCK,
            LOCK
        );
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function getMinimalNextBid(uint _auctionId) external view returns (uint minBid){
        Auction memory currentAuction = auctions[_auctionId];
        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount + (currentAuction.minimalStep);
        }
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function _getMinimalNextBid(Auction memory currentAuction) internal pure returns (uint minBid){
        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount + (currentAuction.minimalStep);
        }
    }

    /// @dev returns true if auction exists, false otherwise
    function checkAuctionExistence(uint _auctionId) external view returns (bool){
        return auctions[_auctionId].seller != address(0);
    }

    /// @dev returns true if auction exists, false otherwise
    function _checkAuctionExistence(Auction memory currentAuction) internal pure returns (bool){
        return currentAuction.seller != address(0);
    }

    /// @dev returns true if newAmount is enough for buyOut
    function buyOutVerify(LibAucDataV1.DataV1 memory aucData, uint newAmount) internal pure returns (bool) {
        if (aucData.buyOutPrice > 0 && aucData.buyOutPrice <= newAmount) {
            return true;
        }
        return false;
    }

    /// @dev finishes, deletes and transfers all assets for an auction if it's ended (it exists, it has at least one bid, now > endTme)
    function finishAuction(uint _auctionId) external nonReentrant {
        Auction memory currentAuction = auctions[_auctionId];
        require(_checkAuctionExistence(currentAuction), "there is no auction with this id");
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        require(
            !_checkAuctionRangeTime(currentAuction, aucData) &&
            currentAuction.buyer != address(0),
            "only ended auction with bid can be finished"
        );
        LibPart.Part memory bidOriginFee = LibBidDataV1.parse(currentAuction.lastBid.data, currentAuction.lastBid.dataType).originFee;
        uint totalAmount = calculateTotalAmount(
            currentAuction.lastBid.amount, 
            currentAuction.protocolFee, 
            bidOriginFee
        );
        doTransfers(
            currentAuction.sellAsset,
            currentAuction.buyAsset,
            currentAuction.lastBid,
            address(this),
            currentAuction.buyer,
            currentAuction.seller,
            currentAuction.protocolFee,
            aucData.originFee,
            _getProxy(currentAuction.buyAsset),
            bidOriginFee,
            totalAmount
        );
        deactivateAuction(_auctionId, currentAuction);
    }

    function doTransfers(
        SellAsset memory sellAsset,
        address buyAsset,
        Bid memory bid, 
        address from,
        address buyer,
        address seller,
        uint128 curProtocolFee,
        LibPart.Part memory aucOriginFee,
        address proxy,
        LibPart.Part memory bidOriginFee,
        uint amount
    ) internal {
        //protocolFee
        amount = transferProtocolFee(
            amount,
            bid.amount,
            curProtocolFee,
            from,
            buyAsset,
            proxy
        );

        //royalties
        amount = transferRoyalties(
            sellAsset,
            amount,
            bid.amount,
            from,
            proxy,
            buyAsset
        );

        //originFeeBid
        amount = transferOriginFee(
            amount,
            bid.amount,
            buyAsset,
            from,
            proxy,
            bidOriginFee
        );

        //originFeeAuc
        amount = transferOriginFee(
            amount,
            bid.amount,
            buyAsset,
            from,
            proxy,
            aucOriginFee
        );

        //transfer bid payouts (what's left of it afer fees) to seller
        transferBid(
            amount,
            buyAsset,
            from,
            seller,
            proxy,
            TO_SELLER,
            PAYOUT
        );

        //transfer nft to buyer
        transferNFT(
            sellAsset,
            address(this),
            buyer,
            TO_BIDDER,
            PAYOUT
        );
    }

    /// @dev returns true if auction started and hasn't finished yet, false otherwise
    function checkAuctionRangeTime(uint _auctionId) external view returns (bool){
        uint currentTime = block.timestamp;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(auctions[_auctionId].data, auctions[_auctionId].dataType);
        if (aucData.startTime > 0 && aucData.startTime > currentTime) {
            return false;
        }
        uint endTime = auctions[_auctionId].endTime;
        if (endTime > 0 && endTime <= currentTime){
            return false;
        }

        return true;
    }

    function _checkAuctionRangeTime(Auction memory currentAuction, LibAucDataV1.DataV1 memory aucData) internal view returns (bool){
        uint currentTime = block.timestamp;
        if (aucData.startTime > 0 && aucData.startTime > currentTime) {
            return false;
        }
        uint endTime = currentAuction.endTime;
        if (endTime > 0 && endTime <= currentTime){
            return false;
        }

        return true;
    }

    /// @dev deletes auction after finalizing
    function deactivateAuction(uint _auctionId, Auction memory currentAuction) internal {
        emit AuctionFinished(_auctionId, currentAuction);
        deleteAuctionForToken(currentAuction.sellAsset.token, currentAuction.sellAsset.tokenId);
        delete auctions[_auctionId];
    }

    /// @dev cancels existing auction without bid
    function cancel(uint _auctionId) external nonReentrant {
        Auction memory currentAuction = auctions[_auctionId];
        require(_checkAuctionExistence(currentAuction), "there is no auction with this id");
        address seller = currentAuction.seller;
        require(seller == _msgSender(), "auction owner not detected");
        require(currentAuction.buyer == address(0), "can't cancel auction with bid");
        transferNFT(
            currentAuction.sellAsset,
            address(this),
            seller,
            TO_SELLER,
            UNLOCK
        );
        deactivateAuction(_auctionId, currentAuction);
        emit AuctionCancelled(_auctionId);
    }

    // todo will there be a problem if buyer is last bidder?
    /// @dev buyout auction if bid satisfies buyout condition
    function buyOut(uint _auctionId, Bid memory bid) external payable nonReentrant {
        Auction memory currentAuction = auctions[_auctionId];
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        checkAuctionInProgress(currentAuction, aucData);
        require(buyOutVerify(aucData, bid.amount), "not enough for buyout");
        LibPart.Part memory bidOriginFee = LibBidDataV1.parse(bid.data, bid.dataType).originFee;
        uint totalAmount = calculateTotalAmount(
            bid.amount, 
            currentAuction.protocolFee, 
            bidOriginFee
        );
        address sender = _msgSender();
        if (currentAuction.buyAsset == address(0)) {
            checkEthReturnChange(totalAmount, sender);
        }
        _buyOut(
            currentAuction,
            bid,
            aucData,
            _auctionId,
            bidOriginFee,
            totalAmount,
            sender
        );
    }

    function _buyOut(
        Auction memory currentAuction,
        Bid memory bid,
        LibAucDataV1.DataV1 memory aucData,
        uint _auctionId,
        LibPart.Part memory newBidOriginFee,
        uint newTotalAmount,
        address sender
    ) internal {
        address proxy = _getProxy(currentAuction.buyAsset);

        _returnBid(
            currentAuction.lastBid,
            currentAuction.buyAsset,
            currentAuction.buyer,
            currentAuction.protocolFee,
            proxy
        );

        address from;
        if (currentAuction.buyAsset == address(0)) {
            // if buyAsset = ETH
            from = address(this);
        } else {
            // if buyAsset = ERC20
            from = sender;
        }
        doTransfers(
            currentAuction.sellAsset,
            currentAuction.buyAsset,
            bid,
            from,
            sender,
            currentAuction.seller,
            currentAuction.protocolFee,
            aucData.originFee,
            proxy,
            newBidOriginFee,
            newTotalAmount
        );
        
        deactivateAuction(_auctionId, currentAuction);
    }

    /// @dev returns current highest bidder for an auction
    function getCurrentBuyer(uint _auctionId) public view returns(address) {
        return auctions[_auctionId].buyer;
    }

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(Auction memory currentAuction, LibAucDataV1.DataV1 memory aucData) internal view{
        require(_checkAuctionExistence(currentAuction) && _checkAuctionRangeTime(currentAuction, aucData), "auction is inactive");
    }

    /// @dev function to call from wrapper to put bid
    function putBidWrapper(uint256 _auctionId) external payable {
        require(auctions[_auctionId].buyAsset == address(0), "only ETH bids allowed");
        putBid(_auctionId, Bid(msg.value, LibBidDataV1.V1, ""));
    }

    /// @dev Used to withdraw faulty bids (bids that failed to return after out-bidding)
    function withdrawFaultyBid(address _to) external {
        address sender = _msgSender();
        uint amount = readyToWithdraw[sender];
        require( amount > 0, "nothing to withdraw");
        readyToWithdraw[sender] = 0;
        _to.transferEth(amount);
    }

    function generatePayouts(address _to) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory payout = new LibPart.Part[](1);
        payout[0].account = payable(_to);
        payout[0].value = 10000;
        return payout;
    }

    function generateOriginFees(LibPart.Part memory fee) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory originFees;
        if (fee.account == address(0)) {
            return originFees;
        }
        originFees = new LibPart.Part[](1);
        originFees[0] = fee;
        return originFees;
    }

    function getProtocolFee() internal view returns(uint) {
        return protocolFee;
    }

    function setProtocolFee(uint128 _protocolFee) external onlyOwner {
        emit ProtocolFeeChanged(protocolFee, _protocolFee);
        protocolFee = _protocolFee;
    }

    function changeMinimalDuration(uint128 newValue) external onlyOwner {
        emit MinimalDurationChanged(minimalDuration, newValue);
        minimalDuration = newValue;
    }

    function prepareBuyAssetType(address _token) internal pure returns(LibAsset.AssetType memory) {
        if (_token == address(0)){
            return LibAsset.AssetType(LibAsset.ETH_ASSET_CLASS, "");
        }
        return LibAsset.AssetType(LibAsset.ERC20_ASSET_CLASS, abi.encode(_token));
    }

    function prepareSellAssetType(SellAsset memory _sellAsset) internal pure returns(LibAsset.AssetType memory) {
        return LibAsset.AssetType(LibAsset.ERC721_ASSET_CLASS, abi.encode(_sellAsset.token, _sellAsset.tokenId));
    }

    function _returnBid(
        Bid memory oldBid,
        address buyAsset,
        address oldBuyer,
        uint128 curProtocolFee,
        address proxy
    ) internal {
        // nothing to return
        if (oldBuyer == address(0)) {
            return;
        }
        uint oldTotalAmount = calculateTotalAmount(oldBid.amount, curProtocolFee, LibBidDataV1.parse(oldBid.data, oldBid.dataType).originFee);
        if (buyAsset == address(0)) {
            (bool success,) = oldBuyer.call{ value: oldTotalAmount }("");
            if (!success) {
                uint currentValueToWithdraw = readyToWithdraw[oldBuyer];
                uint newValueToWithdraw = oldTotalAmount + (currentValueToWithdraw);
                readyToWithdraw[oldBuyer] = newValueToWithdraw;
                emit AvailableToWithdraw(oldBuyer, oldTotalAmount, newValueToWithdraw);
            }
        } else {
            transferBid(
                oldTotalAmount,
                buyAsset,
                address(this),
                oldBuyer,
                proxy,
                TO_BIDDER,
                UNLOCK
            );
        }
    }

    function _getProxy(address buyAsset) internal view returns(address){
        address proxy;
        if (buyAsset != address(0)){
            proxy = transferManager.getProxy(LibAsset.ERC20_ASSET_CLASS);
        }
        return proxy;
    }

    /// @dev check that msg.value more than bid amount with fees and return change
    function checkEthReturnChange(uint totalAmount, address buyer) internal {
        uint msgValue = msg.value;
        require(msgValue >= totalAmount, "not enough ETH");
        uint256 change = msg.value - totalAmount;
        if (change > 0) {
            buyer.transferEth(change);
        }
    }

    uint256[50] private ______gap;
}