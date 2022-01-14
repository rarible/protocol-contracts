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
    mapping(bytes32 => uint) public fills; // take-side fills

    //on-chain orders
    mapping(bytes32 => OrderAndFee) public onChainOrders;

    //struct to hold on-chain order and its protocol fee, fee is updated if order is updated
    struct OrderAndFee {
        LibOrder.Order order;
        uint fee;
    }

    //events
    event Cancel(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);
    event Match(bytes32 leftHash, bytes32 rightHash, address leftMaker, address rightMaker, uint newLeftFill, uint newRightFill, LibAsset.AssetType leftAsset, LibAsset.AssetType rightAsset);
    event UpsertOrder(LibOrder.Order order);
    
    /// @dev Creates new or updates an on-chain order
    function upsertOrder(LibOrder.Order memory order) external payable {
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        LibOrderDataV2.DataV2 memory dataNewOrder = LibOrderData.parse(order);

        //checking if order is correct
        require(_msgSender() == order.maker, "order.maker must be msg.sender");
        require(orderNotFilled(order, orderKeyHash, dataNewOrder), "order already filled");
        
        uint newTotal = getTotalValue(order, orderKeyHash, dataNewOrder);

        //value of makeAsset that needs to be transfered with tx 
        uint sentValue = newTotal;

        //return locked assets only for ETH_ASSET_CLASS for now
        if(checkOrderExistance(orderKeyHash) && order.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            LibOrder.Order memory oldOrder = onChainOrders[orderKeyHash].order;
            uint oldTotal = getTotalValue(oldOrder, orderKeyHash, LibOrderData.parse(oldOrder));
            onChainOrders[orderKeyHash].order = order; //to prevent reentrancy

            sentValue = (newTotal > oldTotal) ? newTotal.sub(oldTotal) : 0;

            //value of makeAsset that needs to be returned to order.maker due to updating of the order
            uint returnValue = (oldTotal > newTotal) ? oldTotal.sub(newTotal) : 0;

            transferLockedAsset(LibAsset.Asset(order.makeAsset.assetType, returnValue), address(this), order.maker, UNLOCK, TO_MAKER);
        } else {
            onChainOrders[orderKeyHash].order = order; //to prevent reentrancy
        }

        if (order.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(order.takeAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "wrong order: ETH to ETH trades are forbidden");
            require(msg.value >= sentValue, "not enough eth");

            if (sentValue > 0) {
                emit Transfer(LibAsset.Asset(order.makeAsset.assetType, sentValue), order.maker, address(this), TO_LOCK, LOCK);
            }

            //returning "change" ETH if msg.value > sentValue
            if (msg.value > sentValue) {
                address(order.maker).transferEth(msg.value.sub(sentValue));
            }
        } else {
            //locking only ETH for now, not locking tokens
        }

        onChainOrders[orderKeyHash].fee = getProtocolFee();

        emit UpsertOrder(order);
    }

    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");

        bytes32 orderKeyHash = LibOrder.hashKey(order);

        //if it's an on-chain order
        if (checkOrderExistance(orderKeyHash)) {
            LibOrder.Order memory temp = onChainOrders[orderKeyHash].order;
            delete onChainOrders[orderKeyHash]; //to prevent reentrancy
            //for now locking only ETH, so returning only locked ETH also
            if (temp.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
                transferLockedAsset(LibAsset.Asset(temp.makeAsset.assetType, getTotalValue(temp, orderKeyHash, LibOrderData.parse(temp))), address(this), temp.maker, UNLOCK, TO_MAKER);
            }
        }

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

        LibFill.FillResult memory newFill = getFillSetNew(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, leftOrderData, rightOrderData);
        
        (uint totalMakeValue, uint totalTakeValue) = doTransfers(matchedAssets, newFill, orderLeft, orderRight, leftOrderData, rightOrderData);
        
        returnChange(matchedAssets, orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, totalMakeValue, totalTakeValue);

        deleteFilledOrder(orderLeft, leftOrderKeyHash);
        deleteFilledOrder(orderRight, rightOrderKeyHash);

        emit Match(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, newFill.rightValue, newFill.leftValue, matchedAssets.makeMatch, matchedAssets.takeMatch);
    }

    function getFillSetNew(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight,
        bytes32 leftOrderKeyHash,
        bytes32 rightOrderKeyHash,
        LibOrderDataV2.DataV2 memory leftOrderData,
        LibOrderDataV2.DataV2 memory rightOrderData
    ) internal returns (LibFill.FillResult memory) {
        uint leftOrderFill = getOrderFill(orderLeft, leftOrderKeyHash);
        uint rightOrderFill = getOrderFill(orderRight, rightOrderKeyHash);
        LibFill.FillResult memory newFill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill, leftOrderData.isMakeFill, rightOrderData.isMakeFill);

        require(newFill.rightValue > 0 && newFill.leftValue > 0, "nothing to fill");

        if (orderLeft.salt != 0) {
            if (leftOrderData.isMakeFill) {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.leftValue);
            } else {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.rightValue);
            }
        }

        if (orderRight.salt != 0) {
            if (rightOrderData.isMakeFill) {
                fills[rightOrderKeyHash] = rightOrderFill.add(newFill.rightValue);
            } else {
                fills[rightOrderKeyHash] = rightOrderFill.add(newFill.leftValue);
            }
        }
        return newFill;
    }

    function returnChange(LibOrder.MatchedAssets memory matchedAssets, LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight, bytes32 leftOrderKeyHash, bytes32 rightOrderKeyHash, uint totalMakeValue, uint totalTakeValue) internal {
        bool ethRequired = matchingRequiresEth(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash);

        if (matchedAssets.makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS && ethRequired) {
            require(matchedAssets.takeMatch.assetClass != LibAsset.ETH_ASSET_CLASS);
            require(msg.value >= totalMakeValue, "not enough eth");
            if (msg.value > totalMakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalMakeValue));
            }
        } else if (matchedAssets.takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS && ethRequired) {
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

    function matchAssets(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal view returns (LibOrder.MatchedAssets memory matchedAssets) {
        matchedAssets.makeMatch = matchAssets(orderLeft.makeAsset.assetType, orderRight.takeAsset.assetType);
        require(matchedAssets.makeMatch.assetClass != 0, "assets don't match");
        matchedAssets.takeMatch = matchAssets(orderLeft.takeAsset.assetType, orderRight.makeAsset.assetType);
        require(matchedAssets.takeMatch.assetClass != 0, "assets don't match");
    }

    function validateFull(LibOrder.Order memory order, bytes memory signature) internal view {
        LibOrder.validate(order);

        //no need to validate signature of an on-chain order
        if (isTheSameAsOnChain(order, LibOrder.hashKey(order))) {
            return;
        } 

        validate(order, signature);
    }

    /// @dev Checks order for existance on-chain by orderKeyHash
    function checkOrderExistance(bytes32 orderKeyHash) public view returns(bool) {
        if(onChainOrders[orderKeyHash].order.maker != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /// @dev Tranfers assets to lock or unlock them
    function transferLockedAsset(LibAsset.Asset memory asset, address from, address to, bytes4 transferType, bytes4 transferDirection) internal {
        if (asset.value == 0) {
            return;
        }

        transfer(asset, from, to, transferDirection, transferType);
    }

    /// @dev Calculates total make amount of order, including fees and fill
    function getTotalValue(LibOrder.Order memory order, bytes32 hash, LibOrderDataV2.DataV2 memory dataOrder) internal view returns(uint) {
        (uint remainingMake, ) = LibOrder.calculateRemaining(order, getOrderFill(order, hash), dataOrder.isMakeFill);
        uint totalAmount = calculateTotalAmount(remainingMake, getOrderProtocolFee(order, hash), dataOrder.originFees);
        return totalAmount;
    }

    /// @dev Checks if order is fully filled, if true then deletes it
    function deleteFilledOrder(LibOrder.Order memory order, bytes32 hash) internal {
        if (!isTheSameAsOnChain(order, hash)) { 
            return;
        }

        uint takeValueLeft = order.takeAsset.value.sub(getOrderFill(order, hash));
        if (takeValueLeft == 0) {
            delete onChainOrders[hash];
        }
    }

    /// @dev Checks if matching such orders requires ether sent with the transaction
    function matchingRequiresEth(
        LibOrder.Order memory orderLeft, 
        LibOrder.Order memory orderRight,
        bytes32 leftOrderKeyHash,
        bytes32 rightOrderKeyHash
    ) internal view returns(bool) {
        //ether is required when one of the orders is simultaneously offchain and has makeAsset = ETH
        if (orderLeft.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (!isTheSameAsOnChain(orderLeft, leftOrderKeyHash)) {
                return true;
            }
        }

        if (orderRight.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (!isTheSameAsOnChain(orderRight, rightOrderKeyHash)) {
                return true;
            }
        }

        return false;
    }

    /// @dev Checks if order is the same as his on-chain version
    function isTheSameAsOnChain(LibOrder.Order memory order, bytes32 hash) internal view returns(bool) {
        if (LibOrder.hash(order) == LibOrder.hash(onChainOrders[hash].order)) {
            return true;
        }
        return false;
    }

    function orderNotFilled(LibOrder.Order memory order, bytes32 hash, LibOrderDataV2.DataV2 memory dataOrder) internal view returns(bool){
        uint value;
        if (dataOrder.isMakeFill) {
            value = order.makeAsset.value;
        } else { 
            value = order.takeAsset.value;
        }
        return (value > fills[hash]);
    }

    uint256[48] private __gap;
}
