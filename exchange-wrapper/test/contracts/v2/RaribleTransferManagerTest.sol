// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";
import "@rarible/transfer-manager/contracts/TransferExecutor.sol";
import "@rarible/exchange-v2/contracts/OrderValidator.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
//import "@rarible/libraries/contracts/LibFill.sol";
//import "@rarible/libraries/contracts/LibOrderData.sol";

contract RaribleTransferManagerTest is RaribleTransferManager, TransferExecutor, OrderValidator {

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }
}
