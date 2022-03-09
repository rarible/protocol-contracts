// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibFill.sol";
import "@rarible/libraries/contracts/LibOrderData.sol";

import "./OrderValidator.sol";
import "./AssetMatcher.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "@rarible/libraries/contracts/LibFeeSide.sol";
import "./EmptyGap.sol";
import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";

abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, RaribleTransferManager, OrderValidator {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;
    using BpLibrary for uint;

    uint256 private constant UINT256_MAX = 2 ** 256 - 1;

    //state of the orders
    mapping(bytes32 => uint) public fills;
    uint public protocolFee;

    //events
    event Cancel(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);
    event Match(bytes32 leftHash, bytes32 rightHash, address leftMaker, address rightMaker, uint newLeftFill, uint newRightFill, LibAsset.AssetType leftAsset, LibAsset.AssetType rightAsset);

    function __EchangeV2Core_init_unchained(
        uint newProtocolFee
    ) internal initializer {
        protocolFee = newProtocolFee;
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
        /*if on of assetClass == ETH, need to transfer ETH to RaribleTransferManager contract before run method doTransfers*/
        if (left.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(right.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "try transfer eth<->eth");
            require(msg.value >= totalLeftValue, "not enough eth");
            uint256 change = msg.value.sub(totalLeftValue);
            if (change > 0) {
                initialSender.transferEth(change);
            }
        } else if (right.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(msg.value >= totalRightValue, "not enough eth");
            uint256 change = msg.value.sub(totalRightValue);
            if (change > 0) {
                initialSender.transferEth(change);
            }
        }
    }

    function matchAndTransfer(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal {
        (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) = matchAssets(orderLeft, orderRight);
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);

        LibOrderDataV2.DataV2 memory leftOrderData = LibOrderData.parse(orderLeft);
        LibOrderDataV2.DataV2 memory rightOrderData = LibOrderData.parse(orderRight);

        LibFill.FillResult memory newFill = getFillSetNew(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, leftOrderData.isMakeFill, rightOrderData.isMakeFill);

        uint256 _protocolFee = protocolFee;
        ITransferManager(transferManager).doTransfers{value : msg.value}(
            LibDeal.DealSide(makeMatch, newFill.leftValue, leftOrderData.payouts, leftOrderData.originFees, orderLeft.maker, _protocolFee),
            LibDeal.DealSide(takeMatch, newFill.rightValue, rightOrderData.payouts, rightOrderData.originFees, orderRight.maker, _protocolFee),
            LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass),
            _msgSender()
        );

        emit Match(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, newFill.rightValue, newFill.leftValue, makeMatch, takeMatch);
    }

    function getFillSetNew(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight,
        bytes32 leftOrderKeyHash,
        bytes32 rightOrderKeyHash,
        bool leftMakeFill,
        bool rightMakeFill
    ) internal returns (LibFill.FillResult memory) {
        uint leftOrderFill = getOrderFill(orderLeft, leftOrderKeyHash);
        uint rightOrderFill = getOrderFill(orderRight, rightOrderKeyHash);
        LibFill.FillResult memory newFill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill, leftMakeFill, rightMakeFill);

        require(newFill.rightValue > 0 && newFill.leftValue > 0, "nothing to fill");

        if (orderLeft.salt != 0) {
            if (leftMakeFill) {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.leftValue);
            } else {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.rightValue);
            }
        }

        if (orderRight.salt != 0) {
            if (rightMakeFill) {
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

    function matchAssets(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal view returns (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) {
        makeMatch = matchAssets(orderLeft.makeAsset.assetType, orderRight.takeAsset.assetType);
        require(makeMatch.assetClass != 0, "assets don't match");
        takeMatch = matchAssets(orderLeft.takeAsset.assetType, orderRight.makeAsset.assetType);
        require(takeMatch.assetClass != 0, "assets don't match");
    }

    function validateFull(LibOrder.Order memory order, bytes memory signature) internal view {
        LibOrder.validate(order);
        validate(order, signature);
    }

    uint256[47] private __gap;
}
