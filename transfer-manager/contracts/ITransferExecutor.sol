// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/royalties/contracts/LibPart.sol";
import "@rarible/libraries/contracts/LibOrder.sol";
import "./TransferExecutorBase.sol";

abstract contract ITransferExecutor is TransferExecutorBase {
    //transfer directions:
//    bytes4 constant TO_MAKER = bytes4(keccak256("TO_MAKER"));
//    bytes4 constant TO_TAKER = bytes4(keccak256("TO_TAKER"));
//
//    //transfer types:
//    bytes4 constant PROTOCOL = bytes4(keccak256("PROTOCOL"));
//    bytes4 constant ROYALTY = bytes4(keccak256("ROYALTY"));
//    bytes4 constant ORIGIN = bytes4(keccak256("ORIGIN"));
//    bytes4 constant PAYOUT = bytes4(keccak256("PAYOUT"));
//
//    //events
//    event Transfer(LibAsset.Asset asset, address from, address to, bytes4 transferDirection, bytes4 transferType);

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
