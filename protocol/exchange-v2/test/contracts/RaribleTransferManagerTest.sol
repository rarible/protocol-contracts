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

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV3(LibOrderDataV3.DataV3 memory data) pure external returns (bytes memory) {
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
            order.maker,
            orderData.protocolFeeEnabled
        );
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
            LibFeeSide.getFeeSide(left.makeAsset.assetType.assetClass, right.makeAsset.assetType.assetClass)
        );
    }
}
