// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibOrder.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/MathUpgradeable.sol";

library LibFill {
    using SafeMathUpgradeable for uint;

    struct FillResult {
        uint makeAmount;
        uint takeAmount;
    }

    /**
     * @dev Should return filled amounts
     * @param leftOrder left order
     * @param rightOrder right order
     * @param leftOrderFill current fill of the left order (0 if order is unfilled)
     * @param rightOrderFill current fille of the right order (0 if order is unfilled)
     */
    function fillOrder(LibOrder.Order memory leftOrder, LibOrder.Order memory rightOrder, uint leftOrderFill, uint rightOrderFill) internal pure returns (FillResult memory) {
        (uint leftMakeAmount, uint leftTakeAmount) = LibOrder.calculateRemaining(leftOrder, leftOrderFill);
        (uint rightMakeAmount, uint rightTakeAmount) = LibOrder.calculateRemaining(rightOrder, rightOrderFill);

        //We have 3 cases here:
        if (leftTakeAmount > rightMakeAmount) { //1st: right order is fully filled
            return fillRight(leftOrder.makeAsset.amount, leftOrder.takeAsset.amount, rightMakeAmount, rightTakeAmount);
        } else if (rightTakeAmount > leftMakeAmount) { //2nd: left order is fully filled
            return fillLeft(leftMakeAmount, leftTakeAmount, rightOrder.makeAsset.amount, rightOrder.takeAsset.amount);
        } else { //3rd. both filled
            return fillBoth(leftMakeAmount, leftTakeAmount, rightTakeAmount);
        }
    }

    function fillBoth(uint leftMakeAmount, uint leftTakeAmount, uint rightTakeAmount) internal pure returns (FillResult memory result) {
        require(rightTakeAmount <= leftMakeAmount, "fillBoth: unable to fill");
        return FillResult(leftMakeAmount, leftTakeAmount);
    }

    function fillRight(uint leftMakeAmount, uint leftTakeAmount, uint rightMakeAmount, uint rightTakeAmount) internal pure returns (FillResult memory result) {
        uint makerAmount = LibMath.safeGetPartialAmountFloor(rightTakeAmount, leftMakeAmount, leftTakeAmount);
        require(makerAmount <= rightMakeAmount, "fillRight: unable to fill");
        return FillResult(rightTakeAmount, makerAmount);
    }

    function fillLeft(uint leftMakeAmount, uint leftTakeAmount, uint rightMakeAmount, uint rightTakeAmount) internal pure returns (FillResult memory result) {
        uint rightTake = LibMath.safeGetPartialAmountFloor(leftTakeAmount, rightMakeAmount, rightTakeAmount);
        require(rightTake <= leftMakeAmount, "fillLeft: unable to fill");
        return FillResult(leftMakeAmount, leftTakeAmount);
    }
}
