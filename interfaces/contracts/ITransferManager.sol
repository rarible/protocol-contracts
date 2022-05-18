// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibDeal.sol";
import "@rarible/libraries/contracts/LibFeeSide.sol";
import "@rarible/exchange-interfaces/contracts/ITransferExecutor.sol";

abstract contract ITransferManager is ITransferExecutor {

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory  right,
        LibFeeSide.FeeSide feeSide,
        uint protocolFee
    ) internal virtual returns (uint totalMakeValue, uint totalTakeValue);
}