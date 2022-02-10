// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@rarible/transfer-manager/contracts/InternalTransferExecutor.sol";
import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@rarible/libraries/contracts/LibDeal.sol";

/// @dev contract to create and interact with auctions
contract AuctionHouse is AuctionHouseBase, InternalTransferExecutor {
    using LibTransfer for address;
    using SafeMathUpgradeable for uint;

    /// @dev default minimal auction duration and also the time for that auction is extended when it's about to end (endTime - now < EXTENSION_DURATION)
    uint256 private constant EXTENSION_DURATION = 15 minutes;

    /// @dev maximum auction duration
    uint256 private constant MAX_DURATION = 1000 days;

    /// @dev mapping to store data of auctions for auctionId
    mapping(uint => Auction) auctions;

    /// @dev mapping to store eth amount that is ready to be withdrawn (used for faulty eth-bids)
    mapping(address => uint) readyToWithdraw;

    /// @dev latest auctionId
    uint256 public auctionId;

    /// @dev minimal auction duration
    uint256 public minimalDuration;

    /// @dev transfer manager for executing the deal
    ITransferManager public transferManager;

    /// @dev current protocol fee
    uint256 public protocolFee;

    function __AuctionHouse_init(
        ITransferManager _transferManager,
        uint _protocolFee
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC1155Receiver_init_unchained();
        __ReentrancyGuard_init_unchained();
        __AuctionHouseBase_init_unchained();
        __AuctionHouse_init_unchained(_transferManager, _protocolFee);
    }

    function __AuctionHouse_init_unchained(
        ITransferManager _transferManager,
        uint256 _protocolFee
    ) internal initializer {
        auctionId = 1;
        transferManager = _transferManager;
        protocolFee = _protocolFee;
        minimalDuration = EXTENSION_DURATION;
    }

    /// @dev creates an auction and locks sell asset
    function startAuction(
        SellAsset memory _sellAsset,
        address _buyAsset,
        uint minimalStep,
        uint minimalPrice,
        bytes4 dataType,
        bytes memory data
    ) external {
        //todo: check if token contract supports ERC721 interface?

        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);
        require(aucData.duration >= minimalDuration && aucData.duration <= MAX_DURATION, "incorrect duration");

        uint endTime = 0;
        if (aucData.startTime > 0){
            require (aucData.startTime >= block.timestamp, "incorrect start time");
            endTime = aucData.startTime.add(aucData.duration);
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
        transfer(LibAsset.Asset(prepareSellAssetType(_sellAsset), 1), sender, address(this), TO_LOCK, LOCK);
        setApproveERC721(_sellAsset.token);

        setAuctionForToken(_sellAsset.token, _sellAsset.tokenId, currentAuctionId);
        
        emit AuctionCreated(currentAuctionId, auc);
    }

    function setApproveERC721(address token) internal {
        address proxy = transferManager.getProxy(LibAsset.ERC721_ASSET_CLASS);
        IERC721Upgradeable tokenContract = IERC721Upgradeable(token);
        if (!tokenContract.isApprovedForAll(address(this), proxy)) {
            tokenContract.setApprovalForAll(proxy, true);
        }
    }

    function setApproveERC20(address token) internal {
        //do nothing if buyAsset = eth
        if (token == address(0)) {
            return;
        }
        IERC20Upgradeable tokenContract = IERC20Upgradeable(token);
        address erc20Proxy = transferManager.getProxy(LibAsset.ERC20_ASSET_CLASS);
        // if allownance for this token is less that 2^100 then set max_uint
        if (tokenContract.allowance(address(this), erc20Proxy) < 2 ** 100) {
            tokenContract.approve(erc20Proxy, 2 ** 256 - 1);
        }
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
        uint endTime = currentAuction.endTime;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        checkAuctionInProgress(currentAuction, aucData);

        if (buyOutVerify(aucData, newAmount)) {
            currentAuction = _buyOut(currentAuction, _auctionId, bid);
            doTransfers(currentAuction);
            deactivateAuction(_auctionId, currentAuction);
            return;
        }
        
        uint currentTime = block.timestamp;
        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            // set endTime if it's not set
            if (currentAuction.endTime == 0){
                endTime = currentTime.add(aucData.duration);
                auctions[_auctionId].endTime = endTime;
                currentAuction.endTime = endTime;
                
            }
            require(newAmount >= currentAuction.minimalPrice, "bid too small");
        } else {//there is bid in auction
            require(currentAuction.buyer != newBuyer, "already winning bid");
            uint256 minAmount = _getMinimalNextBid(currentAuction);
            require(newAmount >= minAmount, "bid too low");
        }
        reserveValue(
            currentAuction.buyAsset,
            currentAuction.buyer,
            newBuyer,
            currentAuction.lastBid, 
            currentAuction.protocolFee,
            bid, 
            currentAuction.protocolFee
        );
        auctions[_auctionId].lastBid = bid;
        auctions[_auctionId].buyer = newBuyer;

        // auction is extended for EXTENSION_DURATION or minimalDuration if (minimalDuration < EXTENSION_DURATION)
        uint minDur = minimalDuration;
        uint extension = (minDur < EXTENSION_DURATION) ? minDur : EXTENSION_DURATION;

        // extends auction time if it's about to end
        if (endTime.sub(currentTime) < extension) {
            endTime = currentTime.add(extension);
            auctions[_auctionId].endTime = endTime;
        }
        emit BidPlaced(_auctionId, newBuyer, bid, endTime);
    }

    /// @dev reserves new bid and returns the last one if it exists
    function reserveValue(
        address _buyAsset, 
        address oldBuyer, address newBuyer, 
        Bid memory oldBid, 
        uint oldProtocolFee, 
        Bid memory newBid, 
        uint newProtocolFee
    ) internal {
        LibAsset.Asset memory transferAsset;
        LibAsset.AssetType memory _buyAssetType = prepareBuyAssetType(_buyAsset);
        if (oldBuyer != address(0x0)) { //return oldAmount to oldBuyer
            uint oldAmount = getBidTotalAmount(oldBid, oldProtocolFee);
            
            transferAsset = LibAsset.Asset(_buyAssetType, oldAmount);

            // workaround bid asset type = ETH for security purposes
            // if eth transfer fails we let previous bidder to withdraw it manually
            if (_buyAssetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
                (bool success,) = oldBuyer.call{ value: oldAmount }("");
                if (!success) {
                    uint currentValueToWithdraw = readyToWithdraw[oldBuyer];
                    uint newValueToWithdraw = oldAmount.add(currentValueToWithdraw);
                    readyToWithdraw[oldBuyer] = newValueToWithdraw;
                    emit AvailableToWithdraw(oldBuyer, oldAmount, newValueToWithdraw);
                }
            } else {
                transfer(transferAsset, address(this), oldBuyer, TO_LOCK, UNLOCK);
            }
        }
        uint newAmount = getBidTotalAmount(newBid, newProtocolFee);
        transferAsset = LibAsset.Asset(_buyAssetType, newAmount);
        transfer(transferAsset, newBuyer, address(this), TO_LOCK, LOCK);
        setApproveERC20(_buyAsset);
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function getMinimalNextBid(uint _auctionId) external view returns (uint minBid){
        Auction memory currentAuction = auctions[_auctionId];
        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount.add(currentAuction.minimalStep);
        }
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function _getMinimalNextBid(Auction memory currentAuction) internal pure returns (uint minBid){
        if (currentAuction.buyer == address(0x0)) {
            minBid = currentAuction.minimalPrice;
        } else {
            minBid = currentAuction.lastBid.amount.add(currentAuction.minimalStep);
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
            "only ended auction with bid can be finished");
        doTransfers(currentAuction);
        deactivateAuction(_auctionId, currentAuction);
    }

    /// @dev transfers auction assets (sellAsset to buyer, buyAsset to seller)
    function doTransfers(Auction memory currentAuction) internal {
        address seller = currentAuction.seller;
        address buyer = currentAuction.buyer;
        LibAsset.Asset memory sellAsset = LibAsset.Asset(prepareSellAssetType(currentAuction.sellAsset), 1);
        if (buyer != address(0x0)) { //bid exists
            
            //form seller side data
            LibAucDataV1.DataV1 memory auctionData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
            LibDeal.DealSide memory sellSide = LibDeal.DealSide(
                sellAsset.assetType,
                sellAsset.value,
                generatePayouts(seller),
                generateOriginFees(auctionData.originFee),
                address(this),
                currentAuction.protocolFee
            );

            //form bidder side data
            Bid memory bid = currentAuction.lastBid;
            LibBidDataV1.DataV1 memory bidData = LibBidDataV1.parse(bid.data, bid.dataType);
            LibDeal.DealSide memory buySide = LibDeal.DealSide(
                prepareBuyAssetType(currentAuction.buyAsset),
                bid.amount,
                generatePayouts(buyer),
                generateOriginFees(bidData.originFee),
                address(this),
                currentAuction.protocolFee
            );
            if (currentAuction.buyAsset == address(0)) {
                uint totalAmount = transferManager.calculateTotalAmount(bid.amount, currentAuction.protocolFee, generateOriginFees(bidData.originFee));
                transferManager.doTransfers{ value: totalAmount }(sellSide, buySide, LibFeeSide.FeeSide.RIGHT, currentAuction.buyer);
            } else {
                transferManager.doTransfers(sellSide, buySide, LibFeeSide.FeeSide.RIGHT, address(0));
            }
        } else {
            transfer(sellAsset, address(this), seller, TO_SELLER, UNLOCK); //nft back to seller
        }
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
        transfer(LibAsset.Asset(prepareSellAssetType(currentAuction.sellAsset), 1), address(this), seller, TO_SELLER, UNLOCK); //nft transfer back to seller
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
        currentAuction = _buyOut(currentAuction, _auctionId, bid);
        doTransfers(currentAuction);
        deactivateAuction(_auctionId, currentAuction);
    }

    /// @dev makes buyout bid the current bid
    function _buyOut(Auction memory currentAuction, uint _auctionId, Bid memory bid) internal returns(Auction memory changedAuction){
        address payable newBuyer = _msgSender();
        uint curProtocolFee = currentAuction.protocolFee;
        reserveValue(
            currentAuction.buyAsset,
            currentAuction.buyer,
            newBuyer,
            currentAuction.lastBid, 
            curProtocolFee,
            bid, 
            curProtocolFee
        );
        changedAuction = currentAuction;
        
        changedAuction.lastBid = bid;
        changedAuction.buyer = newBuyer;
        auctions[_auctionId].lastBid = bid;
        auctions[_auctionId].buyer = newBuyer;
    }

    /// @dev returns current highest bidder for an auction
    function getCurrentBuyer(uint _auctionId) public view returns(address) {
        return auctions[_auctionId].buyer;
    }

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(Auction memory currentAuction, LibAucDataV1.DataV1 memory aucData) internal view{
        require(_checkAuctionExistence(currentAuction) && _checkAuctionRangeTime(currentAuction, aucData), "auction is inactive");
    }

    /// @dev returns total amount for a bid (protocol fee and bid origin fees included)
    function getBidTotalAmount(Bid memory bid, uint _protocolFee) internal view returns(uint) {
        LibBidDataV1.DataV1 memory data = LibBidDataV1.parse(bid.data, bid.dataType);
        return transferManager.calculateTotalAmount(bid.amount, _protocolFee, generateOriginFees(data.originFee));
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

    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        emit ProtocolFeeChanged(protocolFee, _protocolFee);
        protocolFee = _protocolFee;
    }

    function getExternalTransferExecutor() internal view override returns (IExternalTransferExecutor) {
        return transferManager;
    }

    function changeMinimalDuration(uint newValue) external onlyOwner {
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

    uint256[50] private ______gap;
}