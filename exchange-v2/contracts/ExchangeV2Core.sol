// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibFill.sol";
import "@rarible/libraries/contracts/LibOrderData.sol";
import "./OrderValidator.sol";
import "./AssetMatcher.sol";
import "@rarible/libraries/contracts/LibFee.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "./EmptyGap.sol";
import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import {ITransferManager} from "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/transfer-manager/contracts/InternalTransferExecutor.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";

abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, EmptyGap2, OrderValidator, EmptyGap3, InternalTransferExecutor {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;
    using BpLibrary for uint;
    uint public protocolFee;
    uint256 private constant UINT256_MAX = 2 ** 256 - 1;

    //state of the orders
    mapping(bytes32 => uint) public fills; // take-side fills
    ITransferManager public transferManager;
    //transfer types
    bytes4 constant LOCK = bytes4(keccak256("LOCK"));
    bytes4 constant UNLOCK = bytes4(keccak256("UNLOCK"));

    //transfer directions:
    bytes4 constant TO_LOCK = bytes4(keccak256("TO_LOCK"));
    bytes4 constant TO_SELLER = bytes4(keccak256("TO_SELLER"));
    bytes4 constant TO_BIDDER = bytes4(keccak256("TO_BIDDER"));

    //struct to hold on-chain order and its protocol fee, fee is updated if order is updated
    struct OrderAndFee {
        LibOrder.Order order;
        uint fee;
    }

    //events
    event Cancel(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);
    event Match(bytes32 leftHash, bytes32 rightHash, address leftMaker, address rightMaker, uint newLeftFill, uint newRightFill, LibAsset.AssetType leftAsset, LibAsset.AssetType rightAsset);
    event UpsertOrder(LibOrder.Order order);

    function __EchangeV2Core_init_unchained(
        ITransferManager newRaribleTransferManager,
        uint newProtocolFee
    ) internal initializer {
        transferManager = newRaribleTransferManager;
        protocolFee = newProtocolFee;
    }

    function setTransferManager(ITransferManager newRaribleTransferManager) external onlyOwner {
        transferManager = newRaribleTransferManager;
    }

    function setProtocolFee(uint newProtocolFee) external onlyOwner {
        protocolFee = newProtocolFee;
    }

    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        fills[orderKeyHash] = UINT256_MAX;
        emit Cancel(orderKeyHash, order.maker, order.makeAsset.assetType, order.takeAsset.assetType);
    }

    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) external payable {
        validateFull(orderLeft, signatureLeft);
        validateFull(orderRight, signatureRight);
        if (orderLeft.taker != address(0)) {
            require(orderRight.maker == orderLeft.taker, "leftOrder.taker verification failed");
        }
        if (orderRight.taker != address(0)) {
            require(orderRight.taker == orderLeft.maker, "rightOrder.taker verification failed");
        }
        matchAndTransfer(orderLeft, orderRight);
    }

    function matchAndTransfer(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal {
        LibOrder.MatchedAssets memory matchedAssets = matchAssets(orderLeft, orderRight);
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);

        LibOrderDataV2.DataV2 memory leftOrderData = LibOrderData.parse(orderLeft);
        LibOrderDataV2.DataV2 memory rightOrderData = LibOrderData.parse(orderRight);

        LibFill.FillResult memory newFill = getFillSetNew(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, leftOrderData.isMakeFill, rightOrderData.isMakeFill);

        LibFee.MatchFees memory matchFees = getMatchProtocolFees(orderLeft, orderRight, matchedAssets.makeMatch, matchedAssets.takeMatch, leftOrderKeyHash, rightOrderKeyHash);

        ITransferManager(transferManager).doTransfers{value : msg.value}(
            LibDeal.DealSide(matchedAssets.makeMatch, newFill.leftValue, leftOrderData.payouts, leftOrderData.originFees, orderLeft.maker, matchFees.feeSideProtocolFee),
            LibDeal.DealSide(matchedAssets.takeMatch, newFill.rightValue, rightOrderData.payouts, rightOrderData.originFees, orderRight.maker, matchFees.nftSideProtocolFee),
            matchFees.feeSide,
            _msgSender()
        );

        emit Match(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, newFill.rightValue, newFill.leftValue, matchedAssets.makeMatch, matchedAssets.takeMatch);
    }

    function getFillSetNew(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight,
        bytes32 leftOrderKeyHash,
        bytes32 rightOrderKeyHash,
        bool leftFill,
        bool rightFill
    ) internal returns (LibFill.FillResult memory) {
        uint leftOrderFill = getOrderFill(orderLeft, leftOrderKeyHash);
        uint rightOrderFill = getOrderFill(orderRight, rightOrderKeyHash);
        LibFill.FillResult memory newFill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill, leftFill, rightFill);

        require(newFill.rightValue > 0 && newFill.leftValue > 0, "nothing to fill");

        if (orderLeft.salt != 0) {
            if (leftFill) {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.leftValue);
            } else {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.rightValue);
            }
        }

        if (orderRight.salt != 0) {
            if (rightFill) {
                fills[rightOrderKeyHash] = rightOrderFill.add(newFill.rightValue);
            } else {
                fills[rightOrderKeyHash] = rightOrderFill.add(newFill.leftValue);
            }
        }

        return newFill;
    }

    function getOrderFill(LibOrder.Order memory order, bytes32 hash) internal view returns (uint fill) {
        if (order.salt == 0) {
            fill = 0;
        } else {
            fill = fills[hash];
        }
    }

    function matchAssets(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal view returns (LibOrder.MatchedAssets memory matchedAssets) {
        matchedAssets.makeMatch = matchAssets(orderLeft.makeAsset.assetType, orderRight.takeAsset.assetType);
        require(matchedAssets.makeMatch.assetClass != 0, "assets don't match");
        matchedAssets.takeMatch = matchAssets(orderLeft.takeAsset.assetType, orderRight.makeAsset.assetType);
        require(matchedAssets.takeMatch.assetClass != 0, "assets don't match");
    }

    function validateFull(LibOrder.Order memory order, bytes memory signature) internal view {
        LibOrder.validate(order);
        validate(order, signature);
    }

    /// @dev ruturns MatchFees struct with protocol fees of both orders in a match
    function getMatchProtocolFees(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        bytes32 leftKeyHash,
        bytes32 rightKeyHash
    ) internal view returns (LibFee.MatchFees memory){
        LibFee.MatchFees memory result;
        result.feeSide = LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass);
        result.feeSideProtocolFee = protocolFee;
        result.nftSideProtocolFee = protocolFee;

        return result;
    }

    uint256[47] private __gap;
}
