// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "./LibAsset.sol";
import "./LibFill.sol";
import "./TransferExecutor.sol";

abstract contract ITransferManager is ITransferExecutor {
    bytes4 constant TO_MAKER = bytes4(keccak256("TO_MAKER"));
    bytes4 constant TO_TAKER = bytes4(keccak256("TO_TAKER"));

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) internal virtual returns (uint totalMakeAmount, uint totalTakeAmount);
}
