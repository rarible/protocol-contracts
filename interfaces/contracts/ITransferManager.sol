// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "@rarible/libraries/contracts/LibFee.sol";

interface ITransferManager {
    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory  right,
        LibFeeSide.FeeSide feeSide,
        address initialSender
    ) payable external returns (uint totalMakeValue, uint totalTakeValue);
}