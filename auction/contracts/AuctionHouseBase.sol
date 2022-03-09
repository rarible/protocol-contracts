// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./libs/LibAucDataV1.sol";
import "./libs/LibBidDataV1.sol";

import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract AuctionHouseBase is OwnableUpgradeable,  ReentrancyGuardUpgradeable, RaribleTransferManager {

    /// @dev default minimal auction duration and also the time for that auction is extended when it's about to end (endTime - now < EXTENSION_DURATION)
    uint96 internal constant EXTENSION_DURATION = 15 minutes;

    /// @dev maximum auction duration
    uint128 internal constant MAX_DURATION = 1000 days;

    /// @dev mapping to store eth amount that is ready to be withdrawn (used for faulty eth-bids)
    mapping(address => uint) readyToWithdraw;

    /// @dev latest auctionId
    uint256 public auctionId;

    /// @dev minimal auction duration
    uint96 public minimalDuration;

    /// @dev current protocol fee
    uint64 public protocolFee;

    /// @dev minimal bid increase in base points
    uint128 public minimalStepBasePoint;

    /// @dev event that emits when auction is created
    event AuctionCreated(uint indexed auctionId, address buyer, uint128 endTime);
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
    /// @dev event that's emitted when protocolFee changes
    event ProtocolFeeChanged(uint oldValue, uint newValue);

    event MinimalStepChanged(uint oldValue, uint newValue);

    function __AuctionHouseBase_init_unchained(
        uint64 _protocolFee,
        uint128 _minimalStepBasePoint
    ) internal initializer {
        auctionId = 1;
        protocolFee = _protocolFee;
        minimalDuration = EXTENSION_DURATION;
        minimalStepBasePoint = _minimalStepBasePoint;
    }

    /// @dev increments auctionId and returns new value
    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    function setProtocolFee(uint64 _protocolFee) external onlyOwner {
        emit ProtocolFeeChanged(protocolFee, _protocolFee);
        protocolFee = _protocolFee;
    }

    function changeMinimalDuration(uint96 newValue) external onlyOwner {
        emit MinimalDurationChanged(minimalDuration, newValue);
        minimalDuration = newValue;
    }

    function changeMinimalStep(uint128 newValue) external onlyOwner {
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
        originFee[0].value = uint96(data >> 160);
        return originFee;
    }

    uint256[50] private ______gap;
}