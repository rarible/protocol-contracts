// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./libraries/LibFill.sol";
import "./libraries/LibOrderData.sol";
import "./libraries/LibDirectTransfer.sol";
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
    event Match(bytes32 leftHash, bytes32 rightHash, uint newLeftFill, uint newRightFill);

    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        fills[orderKeyHash] = UINT256_MAX;
        emit Cancel(orderKeyHash);
    }

    /**
     * @dev function, generate sellOrder and buyOrder from parameters and call validateAndMatch() for purchase transaction
     * @param direct struct with parameters for purchase operation
     */
    function directPurchase(
        LibDirectTransfer.Purchase calldata direct
    ) external payable {
        LibAsset.AssetType memory nftAssetType = LibAsset.AssetType(direct.nftClass, direct.nftData);
        LibAsset.AssetType memory paymentAssetType = LibAsset.AssetType(direct.paymentClass, direct.paymentData);

        LibAsset.Asset memory nftSell = LibAsset.Asset(nftAssetType, direct.tokenSellAmount);
        LibAsset.Asset memory nftPurchase = LibAsset.Asset(nftAssetType, direct.tokenPurchaseAmount);
        LibAsset.Asset memory paymentSell = LibAsset.Asset(paymentAssetType, direct.priceSell);
        LibAsset.Asset memory paymentPurchase = LibAsset.Asset(paymentAssetType, direct.pricePurchase);

        LibOrder.Order memory sellOrder = LibOrder.Order(direct.seller, nftSell, address(0), paymentSell, direct.salt, 0, 0, LibOrderDataV3.V3_SELL, direct.sellOrderData);
        LibOrder.Order memory purchaseOrder = LibOrder.Order(_msgSender(), paymentPurchase, address(0), nftPurchase, 0, 0, 0, LibOrderDataV3.V3_BUY, direct.purchaseOrderData);
        validateOrders(sellOrder, direct.signature, purchaseOrder, "");
        matchAndTransfer(sellOrder, purchaseOrder);
    }

    /**
     * @dev function, generate sellOrder and buyOrder from parameters and call validateAndMatch() for accept bid transaction
     * @param direct struct with parameters for accept bid operation
     */
    function directAcceptBid(
        LibDirectTransfer.AcceptBid calldata direct
    ) external payable {
        LibAsset.AssetType memory nftAssetType = LibAsset.AssetType(direct.nftClass, direct.nftData);
        LibAsset.AssetType memory paymentAssetType = LibAsset.AssetType(LibAsset.ERC20_ASSET_CLASS, direct.paymentData);

        LibAsset.Asset memory nftBid = LibAsset.Asset(nftAssetType, direct.tokenBidAmount);
        LibAsset.Asset memory nftAccept = LibAsset.Asset(nftAssetType, direct.tokenAcceptAmount);
        LibAsset.Asset memory paymentBid = LibAsset.Asset(paymentAssetType, direct.priceBid);
        LibAsset.Asset memory paymentAccept = LibAsset.Asset(paymentAssetType, direct.priceAccept);

        LibOrder.Order memory bidOrder = LibOrder.Order(direct.buyer, paymentBid, address(0), nftBid, direct.salt, 0, 0, LibOrderDataV3.V3_BUY, direct.bidOrderData);
        LibOrder.Order memory acceptOrder = LibOrder.Order(_msgSender(), nftAccept, address(0), paymentAccept, 0, 0, 0, LibOrderDataV3.V3_SELL, direct.acceptOrderData);
        validateOrders(bidOrder, direct.signature, acceptOrder, "");
        matchAndTransfer(bidOrder, acceptOrder);
    }

    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) external payable {
        validateOrders(orderLeft, signatureLeft, orderRight, signatureRight);
        matchAndTransfer(orderLeft, orderRight);
    }

    /**
      * @dev function, validate orders
      * @param orderLeft left order
      * @param signatureLeft order left signature
      * @param orderRight right order
      * @param signatureRight order right signature
      */
    function validateOrders(LibOrder.Order memory orderLeft, bytes memory signatureLeft, LibOrder.Order memory orderRight, bytes memory signatureRight) internal {
        validateFull(orderLeft, signatureLeft);
        validateFull(orderRight, signatureRight);
        if (orderLeft.taker != address(0)) {
            require(orderRight.maker == orderLeft.taker, "leftOrder.taker verification failed");
        }
        if (orderRight.taker != address(0)) {
            require(orderRight.taker == orderLeft.maker, "rightOrder.taker verification failed");
        }
    }

    /**
        @notice matches valid orders and transfers their assets
        @param orderLeft the left order of the match
        @param orderRight the right order of the match
    */
    function matchAndTransfer(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal {
        (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) = matchAssets(orderLeft, orderRight);

        LibOrderData.GenericOrderData memory leftOrderData = LibOrderData.parse(orderLeft);
        LibOrderData.GenericOrderData memory rightOrderData = LibOrderData.parse(orderRight);

        LibFill.FillResult memory newFill = setFillEmitMatch(
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
                address(_msgSender()).transferEth(msg.value.sub(totalMakeValue));
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(msg.value >= totalTakeValue, "not enough eth");
            if (msg.value > totalTakeValue) {
                address(_msgSender()).transferEth(msg.value.sub(totalTakeValue));
            }
        }
    }

    /**
        @notice determines the max amount of fees for the match
        @param dataTypeLeft data type of the left order
        @param dataTypeRight data type of the right order
        @param leftOrderData data of the left order
        @param rightOrderData data of the right order
        @param feeSide fee side of the match
        @param _protocolFee protocol fee of the match
        @return max fee amount in base points
    */
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
        
        uint matchFees = getSumFees(_protocolFee, leftOrderData.originFees, rightOrderData.originFees);
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

    /**
        @notice calculates amount of fees for the match
        @param _protocolFee protocolFee of the match
        @param originLeft origin fees of the left order
        @param originRight origin fees of the right order
        @return sum of all fees for the match (protcolFee + leftOrder.originFees + rightOrder.originFees)
     */
    function getSumFees(uint _protocolFee, LibPart.Part[] memory originLeft, LibPart.Part[] memory originRight) internal pure returns(uint) {
        //start from protocol fee
        uint result = _protocolFee;

        //adding left origin fees
        for (uint i; i < originLeft.length; i ++) {
            result = result + originLeft[i].value;
        }

        //adding right protocol fees
        for (uint i; i < originRight.length; i ++) {
            result = result + originRight[i].value;
        }

        return result;
    }

    /**
        @notice calculates fills for the matched orders and set them in "fills" mapping
        @param orderLeft left order of the match
        @param orderRight right order of the match
        @param leftMakeFill true if the left orders uses make-side fills, false otherwise
        @param rightMakeFill true if the right orders uses make-side fills, false otherwise
        @return returns change in orders' fills by the match 
    */
    function setFillEmitMatch(
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

        emit Match(leftOrderKeyHash, rightOrderKeyHash, newFill.rightValue, newFill.leftValue);

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

    /**
        @notice returns protocol Fee for V3 or upper orders, 0 for V2 and earlier ordrs
        @param leftDataType type of the left order in a match
        @return protocol fee
    */
    function getProtocolFeeConditional(bytes4 leftDataType) internal view returns(uint) {
        if (leftDataType == LibOrderDataV3.V3_SELL || leftDataType == LibOrderDataV3.V3_BUY) {
            return getProtocolFee();
        }
        return 0;
    }

    uint256[49] private __gap;
}
