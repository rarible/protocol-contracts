// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../lib/LibDeal.sol";
import "./ITransferExecutor.sol";

abstract contract ITransferManager is ITransferExecutor {

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide
    ) internal virtual returns (uint totalMakeValue, uint totalTakeValue);
}