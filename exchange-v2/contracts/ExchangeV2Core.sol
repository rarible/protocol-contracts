// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./libraries/LibFill.sol";
import "./libraries/LibOrderData.sol";
import "./libraries/LibDirectPurchase.sol";
import "./OrderValidator.sol";
import "./AssetMatcher.sol";

import "@rarible/transfer-manager/contracts/TransferExecutor.sol";
import "@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol";
import "@rarible/transfer-manager/contracts/lib/LibDeal.sol";

abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, TransferExecutor, OrderValidator, ITransferManager {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;

    uint256 private constant UINT256_MAX = 2 ** 256 - 1;

    //state of the orders
    mapping(bytes32 => uint) public fills;

    //events
    event Cancel(bytes32 hash);
    event Match(uint newLeftFill, uint newRightFill);

    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        fills[orderKeyHash] = UINT256_MAX;
        emit Cancel(orderKeyHash);
    }

    /**
     * @dev function, generate sellOrder and buyOrder from parameters and call validateAndMatch() for purchase transaction
     * @param direct struct with parameters for buy operation
     * @param sellData data type V3_SELLV for left order
     * @param buyData data type 3_BUY for right order
     */
    function directPurchase(
        LibDirectPurchase.Purchase memory direct,
        bytes memory sellData,
        bytes memory buyData
    ) external payable {
        bytes memory nftAssetData = abi.encode(direct.token, direct.tokenId);
        LibAsset.Asset memory nft = LibAsset.Asset(LibAsset.AssetType(direct.assetType, nftAssetData), direct.tokenAmount);
        LibAsset.Asset memory payment = LibAsset.Asset(LibAsset.AssetType(LibAsset.ETH_ASSET_CLASS, ""), direct.price);

        LibOrder.Order memory orderLeft = LibOrder.Order(direct.seller, nft, address(0), payment, direct.salt, 0, 0, LibOrderDataV3.V3_SELL, sellData);
        LibOrder.Order memory orderRight = LibOrder.Order(msg.sender, payment, address(0), nft, 0, 0, 0, LibOrderDataV3.V3_BUY, buyData);
        validateAndMatch(orderLeft, direct.signature, orderRight);
    }

    /**
     * @dev function, generate sellOrder and buyOrder from parameters and call validateAndMatch() for accept bid transaction
     * @param direct struct with parameters for accept bid operation
     * @param sellData data type V3_BUY for left order
     * @param buyData data type V3_SELL for left order
     */
    function directAcceptBid(
        LibDirectPurchase.AcceptBid memory direct,
        bytes memory buyData,
        bytes memory sellData
    ) external payable {
        bytes memory paymentAssetData = abi.encode(direct.tokenPayment);
        bytes memory nftAssetData = abi.encode(direct.tokenNft, direct.tokenId);
        LibAsset.Asset memory payment = LibAsset.Asset(LibAsset.AssetType(LibAsset.ERC20_ASSET_CLASS, paymentAssetData), direct.price);
        LibAsset.Asset memory nft = LibAsset.Asset(LibAsset.AssetType(direct.assetType, nftAssetData), direct.tokenAmount);

        LibOrder.Order memory orderLeft = LibOrder.Order(direct.buyer, payment, address(0), nft, direct.salt, 0, 0, LibOrderDataV3.V3_BUY, buyData);
        LibOrder.Order memory orderRight = LibOrder.Order(msg.sender, nft, address(0), payment, 0, 0, 0, LibOrderDataV3.V3_SELL, sellData);
        validateAndMatch(orderLeft, direct.signature, orderRight);
    }

    /**
      * @dev function, validate orders and call matchAndTransfer()
      * @param orderLeft left order
      * @param signatureLeft order left signature
      * @param orderRight right order
      */
    function validateAndMatch(LibOrder.Order memory orderLeft, bytes memory signatureLeft, LibOrder.Order memory orderRight) internal {
        validateFull(orderLeft, signatureLeft);
        validateFull(orderRight, "");
        if (orderLeft.taker != address(0)) {
            require(orderRight.maker == orderLeft.taker, "leftOrder.taker verification failed");
        }
        if (orderRight.taker != address(0)) {
            require(orderRight.taker == orderLeft.maker, "rightOrder.taker verification failed");
        }
        matchAndTransfer(orderLeft, orderRight);
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

        LibOrderData.GenericOrderData memory leftOrderData = LibOrderData.parse(orderLeft);
        LibOrderData.GenericOrderData memory rightOrderData = LibOrderData.parse(orderRight);

        LibFill.FillResult memory newFill = getFillSetNew(
            orderLeft, 
            orderRight,
            leftOrderData.isMakeFill,
            rightOrderData.isMakeFill
        );

        (uint totalMakeValue, uint totalTakeValue) = doTransfers(
            LibDeal.DealSide(
                LibAsset.Asset( 
                    makeMatch,
                    newFill.leftValue
                ),
                leftOrderData.payouts,
                leftOrderData.originFees,
                proxies[makeMatch.assetClass],
                orderLeft.maker
            ), 
            LibDeal.DealSide(
                LibAsset.Asset( 
                    takeMatch,
                    newFill.rightValue
                ),
                rightOrderData.payouts,
                rightOrderData.originFees,
                proxies[takeMatch.assetClass],
                orderRight.maker
            ),
            getDealData(
                makeMatch.assetClass,
                takeMatch.assetClass,
                orderLeft.dataType,
                orderRight.dataType,
                leftOrderData,
                rightOrderData
            )
        );
        if (makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(takeMatch.assetClass != LibAsset.ETH_ASSET_CLASS);
            require(msg.value >= totalMakeValue, "not enough eth");
            if (msg.value > totalMakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalMakeValue));
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(msg.value >= totalTakeValue, "not enough eth");
            if (msg.value > totalTakeValue) {
                address(msg.sender).transferEth(msg.value.sub(totalTakeValue));
            }
        }
        emit Match(newFill.rightValue, newFill.leftValue);
    }

    function getMaxFee(
        bytes4 dataTypeLeft, 
        bytes4 dataTypeRight, 
        LibOrderData.GenericOrderData memory leftOrderData, 
        LibOrderData.GenericOrderData memory rightOrderData,
        LibFeeSide.FeeSide feeSide,
        uint _protocolFee
    ) internal pure returns(uint) { 
        if (
            dataTypeLeft != LibOrderDataV3.V3_SELL && 
            dataTypeRight != LibOrderDataV3.V3_SELL &&
            dataTypeLeft != LibOrderDataV3.V3_BUY && 
            dataTypeRight != LibOrderDataV3.V3_BUY 
        ){
            return 0;
        }
        
        uint matchFees = _protocolFee + leftOrderData.originFees[0].value + rightOrderData.originFees[0].value;
        uint maxFee;
        if (feeSide == LibFeeSide.FeeSide.LEFT) {
            maxFee = rightOrderData.maxFeesBasePoint;
            
            require(
                dataTypeLeft == LibOrderDataV3.V3_BUY && 
                dataTypeRight == LibOrderDataV3.V3_SELL,
                "wrong V3 type1"
            );
            
        } else if (feeSide == LibFeeSide.FeeSide.RIGHT) {
            maxFee = leftOrderData.maxFeesBasePoint;
            require(
                dataTypeRight == LibOrderDataV3.V3_BUY && 
                dataTypeLeft == LibOrderDataV3.V3_SELL,
                "wrong V3 type2"
            );
        } else {
            return 0;
        }
        require(
            maxFee > 0 && 
            maxFee >= _protocolFee && 
            maxFee >= matchFees &&
            maxFee <= 1000, 
            "wrong maxFee"
        );
        return maxFee;
    }

    function getDealData(
        bytes4 makeMatchAssetClass,
        bytes4 takeMatchAssetClass,
        bytes4 leftDataType,
        bytes4 rightDataType,
        LibOrderData.GenericOrderData memory leftOrderData,
        LibOrderData.GenericOrderData memory rightOrderData
    ) internal view returns(LibDeal.DealData memory dealData) {
        dealData.protocolFee = getProtocolFeeConditional(leftDataType);
        dealData.feeSide = LibFeeSide.getFeeSide(makeMatchAssetClass, takeMatchAssetClass);
        dealData.maxFeesBasePoint = getMaxFee(
            leftDataType,
            rightDataType,
            leftOrderData,
            rightOrderData,
            dealData.feeSide,
            dealData.protocolFee
        );
    }

    function getFillSetNew(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight,
        bool leftMakeFill,
        bool rightMakeFill
    ) internal returns (LibFill.FillResult memory) {
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);
        uint leftOrderFill = getOrderFill(orderLeft.salt, leftOrderKeyHash);
        uint rightOrderFill = getOrderFill(orderRight.salt, rightOrderKeyHash);
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

    function getOrderFill(uint salt, bytes32 hash) internal view returns (uint fill) {
        if (salt == 0) {
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

    function getProtocolFee() internal virtual view returns(uint);

    function getProtocolFeeConditional(bytes4 leftDataType) internal view returns(uint) {
        if (leftDataType == LibOrderDataV3.V3_SELL || leftDataType == LibOrderDataV3.V3_BUY) {
            return getProtocolFee();
        }
        return 0;
    }

    uint256[47] private __gap;
}
