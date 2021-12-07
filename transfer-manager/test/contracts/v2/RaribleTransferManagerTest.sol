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

    function makeOrderData(
        LibOrder.Order memory order
    ) external pure returns (LibOrderDataV2.DataV2 memory dataLeft){
        dataLeft = LibOrderData.parse(order);
    }

    function makeDealData(
        LibOrder.Order memory order
    ) external pure returns (LibDeal.Data memory dataLeft){
        (dataLeft,) = LibOrderData.parseDeal(order);
    }

    function __TransferManager_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newCommunityWallet,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __RaribleTransferManager_init_unchained(newProtocolFee, newCommunityWallet, newRoyaltiesProvider, _transferProxy, _erc20TransferProxy);
        __OrderValidator_init_unchained();
    }
}