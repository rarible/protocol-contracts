// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/royalties/contracts/LibPart.sol";
import "@rarible/libraries/contracts/LibOrder.sol";

abstract contract ITransferExecutor {
    //events
    event Transfer(LibAsset.Asset asset, address from, address to, bytes4 transferDirection, bytes4 transferType);

    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) internal virtual;

//    function calculateTotalAmount(uint amount,
//        uint feeOnTopBp,
//        LibPart.Part[] memory orderOriginFees
//    ) internal virtual view returns (uint total);
//
//    function getOrderProtocolFee(LibOrder.Order memory order, bytes32 hash) virtual internal view returns(uint);
//
//    function getProtocolFee() virtual internal view returns(uint);
}
