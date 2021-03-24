// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibFill.sol";
import "./ITransferManager.sol";
import "./TransferExecutor.sol";

abstract contract SimpleTransferManager is ITransferManager {
    using SafeMathUpgradeable for uint;

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) override internal returns (uint totalMakeAmount, uint totalTakeAmount) {
        address leftOrderBeneficiary = leftOrder.maker;
        address rightOrderBeneficiary = rightOrder.maker;

        transfer(LibAsset.Asset(makeMatch, fill.makeAmount), leftOrder.maker, rightOrderBeneficiary, PAYOUT, TO_TAKER);
        transfer(LibAsset.Asset(takeMatch, fill.takeAmount), rightOrder.maker, leftOrderBeneficiary, PAYOUT, TO_MAKER);
        totalMakeAmount = fill.makeAmount;
        totalTakeAmount = fill.takeAmount;
    }
    uint256[50] private __gap;
}
