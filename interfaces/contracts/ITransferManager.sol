// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "@rarible/libraries/contracts/LibFeeSide.sol";

abstract contract ITransferManager {
    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal virtual pure returns (uint total);

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory  right,
        LibFeeSide.FeeSide feeSide,
        uint protocolFee
    ) internal virtual returns (uint totalMakeValue, uint totalTakeValue);
}