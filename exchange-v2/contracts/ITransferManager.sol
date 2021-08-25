// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "./LibFill.sol";
import "./TransferExecutor.sol";
import "./LibOrderData.sol";

abstract contract ITransferManager is ITransferExecutor {
    //transfer directions:
    bytes4 constant TO_MAKER = bytes4(keccak256("TO_MAKER"));
    bytes4 constant TO_TAKER = bytes4(keccak256("TO_TAKER"));
    bytes4 constant TO_LOCK = bytes4(keccak256("TO_LOCK"));

    //transfer types:
    bytes4 constant PROTOCOL = bytes4(keccak256("PROTOCOL"));
    bytes4 constant ROYALTY = bytes4(keccak256("ROYALTY"));
    bytes4 constant ORIGIN = bytes4(keccak256("ORIGIN"));
    bytes4 constant PAYOUT = bytes4(keccak256("PAYOUT"));
    bytes4 constant LOCK = bytes4(keccak256("LOCK"));
    bytes4 constant UNLOCK = bytes4(keccak256("UNLOCK"));

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) internal virtual returns (uint totalMakeValue, uint totalTakeValue);


    function calculateTotalAmount(uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal virtual view returns (uint total);

    function getOrderProtocolFee(LibOrder.Order memory order, bytes32 hash) virtual internal view returns(uint);
    
    function getProtocolFee() virtual internal view returns(uint);
    
}
