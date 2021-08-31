// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "./LibFill.sol";
import "./TransferExecutor.sol";
import "./TransferConstants.sol";

abstract contract ITransferManager is ITransferExecutor, TransferConstants {
    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) internal virtual returns (uint totalMakeValue, uint totalTakeValue);
}
