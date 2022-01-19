// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/RaribleTransferManager.sol";
import "../../../contracts/ITransferExecutor.sol";
import "@rarible/exchange-v2/contracts/OrderValidator.sol";
import "@rarible/libraries/contracts/LibOrderData.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "@rarible/libraries/contracts/LibDeal.sol";

contract RaribleTransferManagerTest is RaribleTransferManager, OrderValidator {

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function makeDealData(
        LibOrder.Order memory order
    ) external pure returns (LibOrderDataV2.DataV2 memory dataOrder){
        dataOrder = LibOrderData.parse(order);
    }

    function getDealSide(LibOrder.Order memory order) external returns (LibDeal.DealSide memory dealSide) {
        LibOrderDataV2.DataV2 memory orderData = LibOrderData.parse(order);

        dealSide = LibDeal.DealSide(
            order.makeAsset.assetType,
            order.makeAsset.value,
            orderData.payouts,
            orderData.originFees,
            order.maker,
            300
        );
    }

    function getFeeSide(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) external returns (LibFee.MatchFees memory) {
        LibFee.MatchFees memory result;
        result.feeSide = LibFeeSide.getFeeSide(orderLeft.makeAsset.assetType.assetClass, orderRight.makeAsset.assetType.assetClass);
        return result;
    }



    function __TransferManager_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        address newCommunityWallet,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newCommunityWallet, newRoyaltiesProvider);
    }
}
