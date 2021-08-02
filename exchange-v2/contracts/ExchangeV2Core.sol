// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibFill.sol";
import "./LibOrder.sol";
import "./OrderValidator.sol";
import "./AssetMatcher.sol";
import "./TransferExecutor.sol";
import "./ITransferManager.sol";
import "./lib/LibTransfer.sol";

abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, TransferExecutor, OrderValidator, ITransferManager {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;

    uint256 private constant UINT256_MAX = 2 ** 256 - 1;

    //state of the orders
    mapping(bytes32 => uint) public fills;

    //onchain orders
    mapping(bytes32 => LibOrder.Order) public onChainOrders;

    //events
    event Cancel(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);
    event Match(bytes32 leftHash, bytes32 rightHash, address leftMaker, address rightMaker, uint newLeftFill, uint newRightFill, LibAsset.AssetType leftAsset, LibAsset.AssetType rightAsset);
    event UpsertOrder(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);
    
    function upsertOrder(LibOrder.Order memory order) external payable{
        bytes32 orderKeyHash = LibOrder.hashKey(order);

        if(checkOrderExistance(order)){
            LibOrder.Order memory oldOrder = onChainOrders[orderKeyHash];
            transferWithFees(oldOrder, address(this), order.maker, TO_MAKER);
        }

        uint totalMakeValue = getTotalValue(order);
        //returning ETH if msg.value > order.value
        if (order.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(order.takeAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "wrong order: ETH to ETH trade is forbidden");
            require(msg.value >= totalMakeValue, "not enough eth");
            if (msg.value > totalMakeValue) {
                address(order.maker).transferEth(msg.value.sub(totalMakeValue));
            }
        } else {
            //locking only ETH for now, not locking tokens
            //transferWithFees(order, order.maker, address(this), PROTOCOL);
        }

        onChainOrders[orderKeyHash] = order;

        //checking if order is correct
        validateFull(order, "");
        require(_msgSender() == order.maker, "order.maker must be msg.sender");

        emit UpsertOrder(orderKeyHash, order.maker, order.makeAsset.assetType, order.takeAsset.assetType);
    }

    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        fills[orderKeyHash] = UINT256_MAX;

        //if it's an onchain order
        if (checkOrderExistance(order)){ 
            transferWithFees(order, address(this), order.maker, TO_MAKER);
            delete onChainOrders[orderKeyHash];
        }

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
        (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) = matchAssets(orderLeft, orderRight);
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);
        uint leftOrderFill = getOrderFill(orderLeft, leftOrderKeyHash);
        uint rightOrderFill = getOrderFill(orderRight, rightOrderKeyHash);
        LibFill.FillResult memory newFill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill);
        require(newFill.takeValue > 0, "nothing to fill");

        if (orderLeft.salt != 0) {
            fills[leftOrderKeyHash] = leftOrderFill.add(newFill.takeValue);
        }
        if (orderRight.salt != 0) {
            fills[rightOrderKeyHash] = rightOrderFill.add(newFill.makeValue);
        }

        (uint totalMakeValue, uint totalTakeValue) = doTransfers(makeMatch, takeMatch, newFill, orderLeft, orderRight);

        emit Match(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, newFill.takeValue, newFill.makeValue, makeMatch, takeMatch);

        if (makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS && !(checkOrderExistance(orderLeft))) {
            require(takeMatch.assetClass != LibAsset.ETH_ASSET_CLASS);
            require(msg.value >= totalMakeValue, "not enough eth");
            if (msg.value > totalMakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalMakeValue));
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS && !(checkOrderExistance(orderRight))) {
            require(msg.value >= totalTakeValue, "not enough eth");
            if (msg.value > totalTakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalTakeValue));
            }
        }
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
        //no need to validate signature of an onchain order
        if (!checkOrderExistance(order)){
            validate(order, signature);
        } 
    }

    function checkOrderExistance(LibOrder.Order memory order) public view returns(bool){
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        if(onChainOrders[orderKeyHash].maker != address(0)){
            return true;
        } else {
            return false;
        }
    }

    function transferWithFees(LibOrder.Order memory order, address from, address to, bytes4 transferDirection) internal {
        uint totalMakeValue = getTotalValue(order);
        LibAsset.Asset memory asset = LibAsset.Asset(order.makeAsset.assetType, totalMakeValue);

        transfer(asset, from, to, transferDirection, PROTOCOL);
    }

    function getTotalValue(LibOrder.Order memory order) public view returns(uint){
        uint totalAmount = calculateTotalAmount(order.makeAsset.value, protocolFee, LibOrderData.parse(order).originFees);
        return totalAmount;
    }



    uint256[48] private __gap;
}
