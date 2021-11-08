// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../../../contracts/ITransferManager.sol";

abstract contract SimpleTransferManager is ITransferManager {
    using SafeMathUpgradeable for uint;

    function doTransfers(
        LibOrder.MatchedAssets memory matchedAssets,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibOrderDataV2.DataV2 memory leftOrderData,
        LibOrderDataV2.DataV2 memory rightOrderData
    ) override internal returns (uint totalMakeValue, uint totalTakeValue) {
        address leftOrderBeneficiary = leftOrder.maker;
        address rightOrderBeneficiary = rightOrder.maker;

        transfer(LibAsset.Asset(matchedAssets.makeMatch, fill.leftValue), leftOrder.maker, rightOrderBeneficiary, PAYOUT, TO_TAKER);
        transfer(LibAsset.Asset(matchedAssets.takeMatch, fill.rightValue), rightOrder.maker, leftOrderBeneficiary, PAYOUT, TO_MAKER);
        totalMakeValue = fill.leftValue;
        totalTakeValue = fill.rightValue;
    }

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal override pure returns (uint total) {
        return amount;
    }
    uint256[50] private __gap;
}
