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

    //onchain orders
    mapping(bytes32 => LibOrder.Order) public onChainOrders;

    //events
    event Cancel(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);
    event Match(bytes32 leftHash, bytes32 rightHash, address leftMaker, address rightMaker, uint newLeftFill, uint newRightFill, LibAsset.AssetType leftAsset, LibAsset.AssetType rightAsset);
    event UpsertOrder(LibOrder.Order order);
    
    /// @dev Creates new or updates an onchain order
    function upsertOrder(LibOrder.Order memory order) external payable {
        bytes32 orderKeyHash = LibOrder.hashKey(order);

        //checking if order is correct
        require(_msgSender() == order.maker, "order.maker must be msg.sender");
        require(order.takeAsset.value > fills[orderKeyHash], "such take value is already filled");
        
        uint newTotal = getTotalValue(order, orderKeyHash);
        uint sentValue = newTotal;

        if(checkOrderExistance(orderKeyHash)) {
            LibOrder.Order memory oldOrder = onChainOrders[orderKeyHash];
            uint oldTotal = getTotalValue(oldOrder, orderKeyHash);

            sentValue = (newTotal > oldTotal) ? newTotal.sub(oldTotal) : 0;

            uint returnValue = (oldTotal > newTotal) ? oldTotal.sub(newTotal) : 0;

            transferLockedAsset(LibAsset.Asset(order.makeAsset.assetType, returnValue), address(this), order.maker, UNLOCK, TO_MAKER);
        }

        if (order.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(order.takeAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "wrong order: ETH to ETH trades are forbidden");
            require(msg.value >= sentValue, "not enough eth");

            //returning "change" ETH if msg.value > sentValue
            if (msg.value > sentValue) {
                address(order.maker).transferEth(msg.value.sub(sentValue));
            }
        } else {
            //locking only ETH for now, not locking tokens
        }

        onChainOrders[orderKeyHash] = order;

        emit UpsertOrder(order);
    }

    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");
        bytes32 orderKeyHash = LibOrder.hashKey(order);

        //if it's an onchain order
        if (isTheSameAsOnChain(order, orderKeyHash)) {
            transferLockedAsset(LibAsset.Asset(order.makeAsset.assetType, getTotalValue(order, orderKeyHash)), address(this), order.maker, UNLOCK, TO_MAKER);
            delete onChainOrders[orderKeyHash];
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

        bool ethRequired = matchingRequiresEth(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash);

        if (makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS && ethRequired) {
            require(takeMatch.assetClass != LibAsset.ETH_ASSET_CLASS);
            require(msg.value >= totalMakeValue, "not enough eth");
            if (msg.value > totalMakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalMakeValue));
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS && ethRequired) {
            require(msg.value >= totalTakeValue, "not enough eth");
            if (msg.value > totalTakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalTakeValue));
            }
        }

        deleteFilledOrder(orderLeft, leftOrderKeyHash);
        deleteFilledOrder(orderRight, rightOrderKeyHash);

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
        if (isTheSameAsOnChain(order, LibOrder.hashKey(order))) {
            return;
        } 

        validate(order, signature);
    }

    /// @dev Checks order for existance onchain by orderKeyHash
    function checkOrderExistance(bytes32 orderKeyHash) public view returns(bool) {
        if(onChainOrders[orderKeyHash].maker != address(0)) {
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
    function getTotalValue(LibOrder.Order memory order, bytes32 hash) internal view returns(uint) {
        (uint remainingMake, ) = LibOrder.calculateRemaining(order, getOrderFill(order, hash));
        uint totalAmount = calculateTotalAmount(remainingMake, protocolFee, LibOrderData.parse(order).originFees);
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

    /// @dev Checks if order is the same as his onchain version
    function isTheSameAsOnChain(LibOrder.Order memory order, bytes32 hash) internal view returns(bool){
        if (LibOrder.hash(order) == LibOrder.hash(onChainOrders[hash])){
            return true;
        }
        return false;
    }

    uint256[48] private __gap;
}
