// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibOrderDataV1.sol";
import "@rarible/libraries/contracts/LibOrderDataV2.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";
import "../../../contracts/OrderValidator.sol";

contract RaribleTransferManagerTest is RaribleTransferManager, OrderValidator {

    function __RaribleTransferManagerTest_init_unchained(
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        INftTransferProxy transferProxy,
        IERC20TransferProxy erc20TransferProxy
    )external initializer {
//        __RaribleTransferManager_init_unchained(newDefaultFeeReceiver, newRoyaltiesProvider, transferProxy, erc20TransferProxy);
        __TransferExecutor_init_unchained(transferProxy, erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newDefaultFeeReceiver, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }
}
