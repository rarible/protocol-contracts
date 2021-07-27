// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../../../contracts/ITransferManager.sol";

abstract contract SimpleTransferManager is ITransferManager {
    using SafeMathUpgradeable for uint;

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) override internal returns (uint totalMakeValue, uint totalTakeValue) {
        address leftOrderBeneficiary = leftOrder.maker;
        address rightOrderBeneficiary = rightOrder.maker;

        transfer(LibAsset.Asset(makeMatch, fill.makeValue), leftOrder.maker, rightOrderBeneficiary, PAYOUT, TO_TAKER);
        transfer(LibAsset.Asset(takeMatch, fill.takeValue), rightOrder.maker, leftOrderBeneficiary, PAYOUT, TO_MAKER);
        totalMakeValue = fill.makeValue;
        totalTakeValue = fill.takeValue;
    }

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal override pure returns (uint total){
        return amount;
    }
    uint256[50] private __gap;
}
