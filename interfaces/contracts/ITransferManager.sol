// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibFill.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";

interface ITransferManager {
    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibFill.FillEthTransfer memory ethBack,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibOrderDataV2.DataV2 memory leftOrderData,
        LibOrderDataV2.DataV2 memory rightOrderData
    ) payable external;
}