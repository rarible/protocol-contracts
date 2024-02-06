// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./libs/LibAucDataV1.sol";
import "./libs/LibBidDataV1.sol";
import "./libs/SafeMathUpgradeable96.sol";

import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";
import "@rarible/transfer-manager/contracts/TransferExecutor.sol";

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

abstract contract AuctionHouseBase is OwnableUpgradeable,  ReentrancyGuardUpgradeable, RaribleTransferManager, TransferExecutor {
    using LibTransfer for address;
    using SafeMathUpgradeable for uint;
    using BpLibrary for uint;

    /// @dev default minimal auction duration and also the time for that auction is extended when it's about to end (endTime - now < EXTENSION_DURATION)
    uint96 internal constant EXTENSION_DURATION = 15 minutes;

    /// @dev maximum auction duration
    uint128 internal constant MAX_DURATION = 1000 days;

    /// @dev maximum fee base point
    uint internal constant MAX_FEE_BASE_POINT = 1000;

    /// @dev mapping to store eth amount that is ready to be withdrawn (used for faulty eth-bids)
    mapping(address => uint) readyToWithdraw;

    /// @dev latest auctionId
    uint256 public auctionId;

    /// @dev minimal auction duration
    uint96 public minimalDuration;

    /// @dev minimal bid increase in base points
    uint96 public minimalStepBasePoint;

    /// @dev bid struct
    struct Bid {
        // the amount 
        uint amount;
        // version of Bid to correctly decode data field
        bytes4 dataType;
        // field to store additional information for Bid, can be seen in "LibBidDataV1.sol"
        bytes data;
    }

    /// @dev event that emits when auction is created
    event AuctionCreated(uint indexed auctionId, address seller);
    /// @dev event that emits when bid is placed
    event BidPlaced(uint indexed auctionId, address buyer, uint endTime);
    /// @dev event that emits when auction is finished
    event AuctionFinished(uint indexed auctionId);
    /// @dev event that emits when auction is canceled
    event AuctionCancelled(uint indexed auctionId);
    /// @dev event that emits when auction is bought out
    event AuctionBuyOut(uint indexed auctionId, address buyer);

    /// @dev event that's emitted when user can withdraw ETH from the AuctionHouse
    event AvailableToWithdraw(address indexed owner, uint added, uint total);
    /// @dev event that's emitted when minimal auction duration changes
    event MinimalDurationChanged(uint oldValue, uint newValue);

    event MinimalStepChanged(uint oldValue, uint newValue);

    function __AuctionHouseBase_init_unchained(
        uint96 _minimalStepBasePoint
    ) internal initializer {
        auctionId = 1;
        minimalDuration = EXTENSION_DURATION;
        minimalStepBasePoint = _minimalStepBasePoint;
    }

    /// @dev increments auctionId and returns new value
    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    function changeMinimalDuration(uint96 newValue) external onlyOwner {
        emit MinimalDurationChanged(minimalDuration, newValue);
        minimalDuration = newValue;
    }

    function changeMinimalStep(uint96 newValue) external onlyOwner {
        emit MinimalStepChanged(minimalStepBasePoint, newValue);
        minimalStepBasePoint = newValue;
    }

    function transferNFT (
        address token,
        uint tokenId,
        uint value,
        bytes4 assetClass,
        address from,
        address to
    ) internal {
        transfer(
            getSellAsset(
                token,
                tokenId,
                value,
                assetClass
            ),
            from,
            to,
            proxies[assetClass]
        );
    }

    function transferBid(
        uint value,
        address token,
        address from,
        address to,
        address proxy
    ) internal {
        transfer(
            getBuyAsset(
                token,
                value
            ),
            from,
            to,
            proxy
        );
    }

    function getSellAsset(address token, uint tokenId, uint value, bytes4 assetClass) internal pure returns(LibAsset.Asset memory asset) {
        asset.value = value;
        asset.assetType.assetClass = assetClass;
        asset.assetType.data = abi.encode(token, tokenId);
    }

    function getBuyAsset(address token, uint value) internal pure returns(LibAsset.Asset memory asset) {
        asset.value = value;

        if (token == address(0)){
            asset.assetType.assetClass = LibAsset.ETH_ASSET_CLASS;
        } else {
            asset.assetType.assetClass = LibAsset.ERC20_ASSET_CLASS;
            asset.assetType.data = abi.encode(token);
        }
    }

    function getPayouts(address maker) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory payout = new LibPart.Part[](1);
        payout[0].account = payable(maker);
        payout[0].value = 10000;
        return payout;
    }

    function getOriginFee(uint data) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory originFee = new LibPart.Part[](1);
        originFee[0].account = payable(address(data));
        originFee[0].value = uint96(getValueFromData(data));
        return originFee;
    }

    function _checkAuctionRangeTime(uint endTime, uint startTime) internal view returns (bool){
        uint currentTime = block.timestamp;
        if (startTime > 0 && startTime > currentTime) {
            return false;
        }
        if (endTime > 0 && endTime <= currentTime){
            return false;
        }

        return true;
    }

    /// @dev returns true if newAmount is enough for buyOut
    function buyOutVerify(LibAucDataV1.DataV1 memory aucData, uint newAmount) internal pure returns (bool) {
        if (aucData.buyOutPrice > 0 && aucData.buyOutPrice <= newAmount) {
            return true;
        }
        return false;
    }

    /// @dev returns true if auction exists, false otherwise
    function _checkAuctionExistence(address seller) internal pure returns (bool){
        return seller != address(0);
    }

    /// @dev Used to withdraw faulty bids (bids that failed to return after out-bidding)
    function withdrawFaultyBid(address _to) external {
        address sender = _msgSender();
        uint amount = readyToWithdraw[sender];
        require( amount > 0, "nothing to withdraw");
        readyToWithdraw[sender] = 0;
        _to.transferEth(amount);
    }

    function _returnBid(
        Bid memory oldBid,
        address buyAsset,
        address oldBuyer,
        address proxy
    ) internal {
        // nothing to return
        if (oldBuyer == address(0)) {
            return;
        }
        if (buyAsset == address(0)) {
            (bool success,) = oldBuyer.call{ value: oldBid.amount }("");
            if (!success) {
                uint currentValueToWithdraw = readyToWithdraw[oldBuyer];
                uint newValueToWithdraw = oldBid.amount.add(currentValueToWithdraw);
                readyToWithdraw[oldBuyer] = newValueToWithdraw;
                emit AvailableToWithdraw(oldBuyer, oldBid.amount, newValueToWithdraw);
            }
        } else {
            transferBid(
                oldBid.amount,
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
        uint256 change = msgValue.sub(totalAmount);
        if (change > 0) {
            buyer.transferEth(change);
        }
    }

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(address seller, uint endTime, uint startTime) internal view{
        require(_checkAuctionExistence(seller) && _checkAuctionRangeTime(endTime, startTime), "auction is inactive");
    }

    /// @dev reserves new bid and returns the last one if it exists
    function reserveBid(
        address buyAsset,
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
    function _getMinimalNextBid(address buyer, uint96 minimalPrice, uint amount) internal view returns (uint minBid){
        if (buyer == address(0x0)) {
            minBid = minimalPrice;
        } else {
            minBid = amount.add(amount.bp(minimalStepBasePoint));
        }
    }

    function getValueFromData(uint data) internal pure returns(uint) {
        return (data >> 160);
    }

    uint256[50] private ______gap;
}