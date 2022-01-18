// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibFill.sol";
import "@rarible/libraries/contracts/LibOrderData.sol";
import "./OrderValidator.sol";
import "./AssetMatcher.sol";
import "@rarible/libraries/contracts/LibFee.sol";
import "./EmptyGap.sol";
import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import {ITransferManager} from "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/transfer-manager/contracts/ITransferExecutor.sol";

//abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, TransferExecutor, OrderValidator, ITransferManager {
abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, EmptyGap2, OrderValidator, ITransferExecutor {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;
    uint public protocolFee;
    uint256 private constant UINT256_MAX = 2 ** 256 - 1;

    //state of the orders
    mapping(bytes32 => uint) public fills; // take-side fills
    ITransferManager public raribleTransferManager;
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

    function __EchangeV2Core_init_unchained(
        ITransferManager newRaribleTransferManager,
        uint newProtocolFee
    ) internal initializer {
        raribleTransferManager = newRaribleTransferManager;
        protocolFee = newProtocolFee;
    }

    function setTransferManager(ITransferManager newRaribleTransferManager) external onlyOwner {
        raribleTransferManager = newRaribleTransferManager;
    }

    function setProtocolFee(uint newProtocolFee) external onlyOwner {
        protocolFee = newProtocolFee;
    }

    /// @dev Creates new or updates an on-chain order
    function upsertOrder(LibOrder.Order memory order) external payable {
        require(order.salt != 0, "salt == 0");
        bytes32 orderKeyHash = LibOrder.hashKey(order, true);
//        LibOrderDataV2.DataV2 memory dataNewOrder = LibOrderData.parse(order);
        (LibDeal.Data memory dealData, bool makeFill) = LibOrderData.parse(order);

        //checking if order is correct
        require(_msgSender() == order.maker, "order.maker must be msg.sender");
        require(orderNotFilled(order, orderKeyHash, makeFill), "order already filled");
        
        uint newTotal = getTotalValue(order, orderKeyHash, dealData.originFees, makeFill);

        //value of makeAsset that needs to be transfered with tx 
        uint sentValue = newTotal;

        //return locked assets only for ETH_ASSET_CLASS for now
        if(checkOrderExistance(orderKeyHash) && order.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            LibOrder.Order memory oldOrder = onChainOrders[orderKeyHash].order;
            (LibDeal.Data memory dealData, bool makeFill) = LibOrderData.parse(oldOrder);
            uint oldTotal = getTotalValue(oldOrder, orderKeyHash, dealData.originFees, makeFill);
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

        bytes32 orderKeyHash = LibOrder.hashKey(order, true);

        //if it's an on-chain order
        if (checkOrderExistance(orderKeyHash)) {
            LibOrder.Order memory temp = onChainOrders[orderKeyHash].order;
            delete onChainOrders[orderKeyHash]; //to prevent reentrancy
            //for now locking only ETH, so returning only locked ETH also
            if (temp.makeAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
                (LibDeal.Data memory dealData, bool makeFill) = LibOrderData.parse(temp);
                transferLockedAsset(LibAsset.Asset(temp.makeAsset.assetType, getTotalValue(temp, orderKeyHash, dealData.originFees, makeFill)), address(this), temp.maker, UNLOCK, TO_MAKER);
            }
        } else {
            orderKeyHash = LibOrder.hashKey(order, false);
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
        bytes32 leftOrderKeyHash = validateFull(orderLeft, signatureLeft);
        bytes32 rightOrderKeyHash = validateFull(orderRight, signatureRight);
        if (orderLeft.taker != address(0)) {
            require(orderRight.maker == orderLeft.taker, "leftOrder.taker verification failed");
        }
        if (orderRight.taker != address(0)) {
            require(orderRight.taker == orderLeft.maker, "rightOrder.taker verification failed");
        }
        matchAndTransfer(orderLeft, leftOrderKeyHash, orderRight, rightOrderKeyHash);
    }

    function matchAndTransfer(LibOrder.Order memory orderLeft, bytes32 leftOrderKeyHash, LibOrder.Order memory orderRight, bytes32 rightOrderKeyHash) internal {
        LibOrder.MatchedAssets memory matchedAssets = matchAssets(orderLeft, orderRight);

//        LibOrderDataV2.DataV2 memory leftOrderData = LibOrderData.parse(orderLeft);
//        LibOrderDataV2.DataV2 memory rightOrderData = LibOrderData.parse(orderRight);
//
//        LibFill.FillResult memory newFill = getFillSetNew(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, leftOrderData, rightOrderData);

        (LibDeal.Data memory leftDealData,
        LibDeal.Data memory rightDealData,
        LibFill.FillResult memory newFill,
        LibFill.IsMakeFill memory makeFill) = prepareData(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash);

        LibFee.MatchFees memory matchFees = getMatchFees(orderLeft, orderRight, matchedAssets.makeMatch, matchedAssets.takeMatch, leftOrderKeyHash, rightOrderKeyHash);
//        (uint totalMakeValue, uint totalTakeValue) = doTransfers(matchedAssets, newFill, orderLeft, orderRight, leftOrderData, rightOrderData, matchFees);

        //        LibFee.TransferAddresses memory adresses = LibFee.TransferAddresse();
        (uint totalMakeValue, uint totalTakeValue) = ITransferManager(raribleTransferManager).doTransfers{value : msg.value}(
            LibAsset.Asset(matchedAssets.makeMatch, newFill.leftValue),
            LibAsset.Asset(matchedAssets.takeMatch, newFill.rightValue),
            leftDealData,
            rightDealData,
//            orderLeft.maker,
//            orderRight.maker,
//            _msgSender(),
//            adresses,
            LibFee.TransferAddresses(orderLeft.maker, orderRight.maker, _msgSender()),
            matchFees
        );

        returnChange(matchedAssets, orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, totalMakeValue, totalTakeValue);

        deleteFilledOrder(orderLeft, leftOrderKeyHash,  makeFill.leftMake);
        deleteFilledOrder(orderRight, rightOrderKeyHash, makeFill.rightMake);

        emit Match(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, newFill.rightValue, newFill.leftValue, matchedAssets.makeMatch, matchedAssets.takeMatch);
    }

    function prepareData(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight,
        bytes32 leftOrderKeyHash,
        bytes32 rightOrderKeyHash
    ) internal returns (
        LibDeal.Data memory leftDealData,
        LibDeal.Data memory rightDealData,
        LibFill.FillResult memory newFill,
        LibFill.IsMakeFill memory makeFill
    ) {
        (leftDealData, makeFill.leftMake) = LibOrderData.parse(orderLeft);
        (rightDealData, makeFill.rightMake) = LibOrderData.parse(orderRight);
        newFill = getFillSetNew(orderLeft, orderRight, leftOrderKeyHash, rightOrderKeyHash, makeFill.leftMake, makeFill.rightMake);
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
        //Don`t need ETH, but there is ETH in msg.value, return it back
        if (ethRequired == false && msg.value > 0) {
            address(msg.sender).transferEth(msg.value);
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

    function validateFull(LibOrder.Order memory order, bytes memory signature) internal view returns(bytes32 hashOrder) {
        LibOrder.validate(order);

        hashOrder = LibOrder.hashKey(order, true);
        //no need to validate signature of an on-chain order
        if (!isTheSameAsOnChain(order, hashOrder)) {
            validate(order, signature);
            hashOrder = LibOrder.hashKey(order, false);
        }
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
    function getTotalValue(LibOrder.Order memory order, bytes32 hash, LibPart.Part[] memory originFees, bool makeFill) internal view returns(uint) {
        (uint remainingMake, ) = LibOrder.calculateRemaining(order, getOrderFill(order, hash), makeFill);
        uint totalAmount = calculateTotalAmount(remainingMake, getOrderProtocolFee(order, hash), originFees);
        return totalAmount;
    }

    /// @dev Checks if order is fully filled, if true then deletes it
    function deleteFilledOrder(LibOrder.Order memory order, bytes32 hash, bool makeFill) internal {
        if (!isTheSameAsOnChain(order, hash)) {
            return;
        }

        uint value;
        if (makeFill) {
            value = order.makeAsset.value;
        } else {
            value = order.takeAsset.value;
        }

        uint takeValueLeft = value.sub(getOrderFill(order, hash));
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

    function orderNotFilled(LibOrder.Order memory order, bytes32 hash, bool isMakeFill) internal view returns(bool){
        uint value;
        if (isMakeFill) {
            value = order.makeAsset.value;
        } else { 
            value = order.takeAsset.value;
        }
        return (value > fills[hash]);
    }

    /// @dev ruturns MatchFees struct with protocol fees of both orders in a match
    function getMatchFees(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        bytes32 leftKeyHash,
        bytes32 rightKeyHash
    ) internal view returns(LibFee.MatchFees memory){
        LibFee.MatchFees memory result;
        result.feeSide = LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass);
        uint leftFee = getOrderProtocolFee(leftOrder, leftKeyHash);
        uint rightFee = getOrderProtocolFee(rightOrder, rightKeyHash);
        if (result.feeSide == LibFeeSide.FeeSide.MAKE) {
            result.feeSideProtocolFee = leftFee;
            result.nftSideProtocolFee = rightFee;
        } else if (result.feeSide == LibFeeSide.FeeSide.TAKE) {
            result.feeSideProtocolFee = rightFee;
            result.nftSideProtocolFee = leftFee;
        }

        return result;
    }

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal pure returns (uint total){
        total = amount.add(amount.bp(feeOnTopBp));
        for (uint256 i = 0; i < orderOriginFees.length; i++) {
            total = total.add(amount.bp(orderOriginFees[i].value));
        }
    }

    function getOrderProtocolFee(LibOrder.Order memory order, bytes32 hash) internal view returns(uint) {
        if (isTheSameAsOnChain(order, hash)) {
            return onChainOrders[hash].fee;
        } else {
            return protocolFee;
        }
    }

    function getProtocolFee() internal view returns(uint) {
        return protocolFee;
    }

    uint256[47] private __gap;
}
