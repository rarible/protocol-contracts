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
    using BpLibrary for uint;

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

    uint128 public minimalStepBasePoint;

    function __AuctionHouse_init(
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        address transferProxy,
        address erc20TransferProxy,
        uint128 _protocolFee,
        uint128 _minimalStepBasePoint
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC1155Receiver_init_unchained();
        __ReentrancyGuard_init_unchained();
        __AuctionHouseBase_init_unchained();
        __AuctionTransferExecutor_init_unchained();
        __TransferManagerCore_init_unchained(newDefaultFeeReceiver, newRoyaltiesProvider, transferProxy, erc20TransferProxy);
        __AuctionHouse_init_unchained(_protocolFee, _minimalStepBasePoint);
    }

    function __AuctionHouse_init_unchained(
        uint128 _protocolFee,
        uint128 _minimalStepBasePoint
    ) internal initializer {
        auctionId = 1;
        protocolFee = _protocolFee;
        minimalDuration = EXTENSION_DURATION;
        minimalStepBasePoint = _minimalStepBasePoint;
    }

    /// @dev creates an auction and locks sell asset
    function startAuction(
        SellAsset memory _sellAsset,
        address _buyAsset,
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
            endTime = uint128(aucData.startTime + aucData.duration);
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
            minimalPrice,
            protocolFee,
            dataType,
            data
        );
        auctions[currentAuctionId] = auc;
        transferNFT(
            _sellAsset,
            sender,
            address(this)
        );
        setAuctionForToken(_sellAsset.token, _sellAsset.tokenId, currentAuctionId);
        
        emit AuctionCreated(currentAuctionId, endTime);
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
        uint bidOriginFee = LibBidDataV1.parse(bid.data, bid.dataType).originFee;
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
                endTime = uint128(currentTime + aucData.duration);
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
        emit BidPlaced(_auctionId, endTime);
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
            proxy
        );
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function getMinimalNextBid(uint _auctionId) external view returns (uint minBid){
        Auction memory currentAuction = auctions[_auctionId];
        return _getMinimalNextBid(currentAuction);
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function _getMinimalNextBid(Auction memory currentAuction) internal view returns (uint minBid){
        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount + currentAuction.lastBid.amount.bp(minimalStepBasePoint);
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
        uint bidOriginFee = LibBidDataV1.parse(currentAuction.lastBid.data, currentAuction.lastBid.dataType).originFee;
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
        emit AuctionFinished(_auctionId);
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
            seller
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
        uint bidOriginFee = LibBidDataV1.parse(bid.data, bid.dataType).originFee;
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
        uint newBidOriginFee,
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
        emit AuctionBuyOut(auctionId);
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

    function setProtocolFee(uint128 _protocolFee) external onlyOwner {
        emit ProtocolFeeChanged(protocolFee, _protocolFee);
        protocolFee = _protocolFee;
    }

    function changeMinimalDuration(uint128 newValue) external onlyOwner {
        emit MinimalDurationChanged(minimalDuration, newValue);
        minimalDuration = newValue;
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
                proxy
            );
        }
    }

    function _getProxy(address buyAsset) internal view returns(address){
        address proxy;
        if (buyAsset != address(0)){
            proxy = proxies[LibAsset.ERC20_ASSET_CLASS];
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