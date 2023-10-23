// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";
import "@rarible/transfer-manager/contracts/TransferExecutor.sol";
import "@rarible/transfer-manager/contracts/lib/LibDeal.sol";
import "@rarible/transfer-manager/contracts/lib/LibFeeSide.sol";

import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";

import "../../contracts/libraries/LibOrderData.sol";

contract RaribleTransferManagerTest is RaribleTransferManager, TransferExecutor {
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

    function getDealData(
        bytes4 makeMatchAssetClass,
        bytes4 takeMatchAssetClass,
        bytes4 leftDataType,
        bytes4 rightDataType,
        LibOrderData.GenericOrderData memory leftOrderData,
        LibOrderData.GenericOrderData memory rightOrderData
    ) internal view returns(LibDeal.DealData memory dealData) {
        dealData.protocolFee = protocolFee;
        dealData.feeSide = LibFeeSide.getFeeSide(makeMatchAssetClass, takeMatchAssetClass);
        dealData.maxFeesBasePoint = getMaxFee(
            leftDataType,
            rightDataType,
            leftOrderData,
            rightOrderData,
            dealData.feeSide
        );
    }

    /**
        @notice determines the max amount of fees for the match
        @param dataTypeLeft data type of the left order
        @param dataTypeRight data type of the right order
        @param leftOrderData data of the left order
        @param rightOrderData data of the right order
        @param feeSide fee side of the match
        @return max fee amount in base points
    */
    function getMaxFee(
        bytes4 dataTypeLeft,
        bytes4 dataTypeRight,
        LibOrderData.GenericOrderData memory leftOrderData,
        LibOrderData.GenericOrderData memory rightOrderData,
        LibFeeSide.FeeSide feeSide
    ) internal pure returns(uint) {
        if (
            dataTypeLeft != LibOrderDataV3.V3_SELL &&
            dataTypeRight != LibOrderDataV3.V3_SELL &&
            dataTypeLeft != LibOrderDataV3.V3_BUY &&
            dataTypeRight != LibOrderDataV3.V3_BUY
        ){
            return 0;
        }

        uint matchFees = getSumFees(leftOrderData.originFees, rightOrderData.originFees);
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

    /**
        @notice calculates amount of fees for the match
        @param originLeft origin fees of the left order
        @param originRight origin fees of the right order
        @return sum of all fees for the match (protcolFee + leftOrder.originFees + rightOrder.originFees)
     */
    function getSumFees(LibPart.Part[] memory originLeft, LibPart.Part[] memory originRight) internal pure returns(uint) {
        uint result = 0;

        //adding left origin fees
        for (uint i; i < originLeft.length; i ++) {
            result = result + originLeft[i].value;
        }

        //adding right origin fees
        for (uint i; i < originRight.length; i ++) {
            result = result + originRight[i].value;
        }

        return result;
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
