// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/RaribleTransferManager.sol";
import "@rarible/exchange-v2/contracts/OrderValidator.sol";
import "@rarible/libraries/contracts/LibOrderData.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "@rarible/libraries/contracts/LibFeeSide.sol";

import "@rarible/transfer-manager/contracts/TransferExecutor.sol";


contract RaribleTransferManagerTest is RaribleTransferManager, TransferExecutor, OrderValidator {
    struct ProtocolFeeSide {
        LibFeeSide.FeeSide feeSide;
    }

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function init____(
        address _transferProxy,
        address _erc20TransferProxy,
        uint newProtocolFee,
        address newCommunityWallet,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newCommunityWallet, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
    }

    function getDealSide(LibOrder.Order memory order, LibOrderData.GenericOrderData memory orderData) internal view returns (LibDeal.DealSide memory dealSide) {
        dealSide = LibDeal.DealSide(
            order.makeAsset,
            orderData.payouts,
            orderData.originFees,
            proxies[order.makeAsset.assetType.assetClass],
            order.maker
        );
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
                dataTypeRight == LibOrderDataV3.V3_SELL &&
                matchFees <= maxFee,
                "wrong V3 type1"
            );
        } else if (feeSide == LibFeeSide.FeeSide.RIGHT) {
            maxFee = leftOrderData.maxFeesBasePoint;
            require(
                dataTypeRight == LibOrderDataV3.V3_BUY && 
                dataTypeLeft == LibOrderDataV3.V3_SELL &&
                matchFees <= maxFee,
                "wrong V3 type1"
            );
        } else {
            return 0;
        }
        require(maxFee > 0 && maxFee >= _protocolFee && maxFee <= 1000, "wrong maxFee");
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
        dealData.protocolFee = getProtocolFeeConditional(makeMatchAssetClass);
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

    function getProtocolFeeConditional(bytes4 leftDataType) internal view returns(uint) {
        if (leftDataType == LibOrderDataV3.V3_SELL || leftDataType == LibOrderDataV3.V3_BUY) {
            return protocolFee;
        }
        return 0;
    }

    function doTransfersExternal(
        LibOrder.Order memory left,
        LibOrder.Order memory right
    ) external payable returns (uint totalLeftValue, uint totalRightValue) {
        LibOrderData.GenericOrderData memory leftData = LibOrderData.parse(left);
        LibOrderData.GenericOrderData memory rightData = LibOrderData.parse(right);

        return doTransfers(
            getDealSide(left, leftData), 
            getDealSide(right, rightData), 
            getDealData(
                left.makeAsset.assetType.assetClass,
                right.makeAsset.assetType.assetClass,
                left.dataType,
                right.dataType,
                leftData,
                rightData
            )
        );
    }

}
