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


    function makeDealData(
        LibOrder.Order memory order
    ) external pure returns (LibOrderDataV2.DataV2 memory dataOrder){
        dataOrder = LibOrderData.parse(order);
    }

    function getDealSide(LibOrder.Order memory order) external view returns (LibDeal.DealSide memory dealSide) {
        LibOrderDataV2.DataV2 memory orderData = LibOrderData.parse(order);

        dealSide = LibDeal.DealSide(
            order.makeAsset,
            orderData.payouts,
            orderData.originFees,
            proxies[order.makeAsset.assetType.assetClass],
            order.maker
        );
    }

    function getFeeSide(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) external pure returns (RaribleTransferManagerTest.ProtocolFeeSide memory) {
        RaribleTransferManagerTest.ProtocolFeeSide memory result;
        result.feeSide = LibFeeSide.getFeeSide(orderLeft.makeAsset.assetType.assetClass, orderRight.makeAsset.assetType.assetClass);
        return result;
    }

    function doTransfersExternal(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide,
        uint _protocolFee
    ) external payable returns (uint totalLeftValue, uint totalRightValue) {
        return doTransfers(left, right, feeSide, _protocolFee);
    }

}
