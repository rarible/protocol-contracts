// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibOrder.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/MathUpgradeable.sol";

library LibFill {
    using SafeMathUpgradeable for uint;

    struct FillResult {
        uint makeValue;
        uint takeValue;
    }

    /**
     * @dev Should return filled values
     * @param leftOrder left order
     * @param rightOrder right order
     * @param leftOrderFill current fill of the left order (0 if order is unfilled)
     * @param rightOrderFill current fill of the right order (0 if order is unfilled)
     */
    function fillOrder(LibOrder.Order memory leftOrder, LibOrder.Order memory rightOrder, uint leftOrderFill, uint rightOrderFill) internal pure returns (FillResult memory) {
        (uint leftMakeValue, uint leftTakeValue) = LibOrder.calculateRemaining(leftOrder, leftOrderFill);
        (uint rightMakeValue, uint rightTakeValue) = LibOrder.calculateRemaining(rightOrder, rightOrderFill);

        //We have 3 cases here:
        if (leftTakeValue > rightMakeValue) { //1st: right order is fully filled
            return fillRight(leftOrder.makeAsset.value, leftOrder.takeAsset.value, rightMakeValue, rightTakeValue);
        } else if (rightTakeValue > leftMakeValue) { //2nd: left order is fully filled
            return fillLeft(leftMakeValue, leftTakeValue, rightOrder.makeAsset.value, rightOrder.takeAsset.value);
        } else { //3rd. both filled
            return fillBoth(leftMakeValue, leftTakeValue, rightTakeValue);
        }
        //1) проверка внутри rightTakeValue <= leftMakeValue не нужна т к ветки такие:
        //when {
        //    a ->
        //    !a b ->
        //    !a !b -> тут еще раз проверяется что require(!b)
        //}
        //это можно записать так для большей прозрачности (сути не меняет)
//        if (leftTakeValue > rightMakeValue) { //1st: right order is fully filled
//            return fillRight(leftOrder.makeAsset.value, leftOrder.takeAsset.value, rightMakeValue, rightTakeValue);
//        } else {
//            if (rightTakeValue > leftMakeValue) { //2nd: left order is fully filled
//                return fillLeft(leftMakeValue, leftTakeValue, rightOrder.makeAsset.value, rightOrder.takeAsset.value);
//            } else { //3rd. both filled
//                return fillBoth(leftMakeValue, leftTakeValue, rightTakeValue);
//            }
//        }
        //или так
//        if (leftTakeValue > rightMakeValue) {//1st: right order is fully filled
//            return fillRight(leftOrder.makeAsset.value, leftOrder.takeAsset.value, rightMakeValue, rightTakeValue);
//        }
//        if (rightTakeValue > leftMakeValue) {//2nd: left order is fully filled
//            return fillLeft(leftMakeValue, leftTakeValue, rightOrder.makeAsset.value, rightOrder.takeAsset.value);
//        }
//        //3rd. both filled
//        return fillBoth(leftMakeValue, leftTakeValue, rightTakeValue);

        //2) формулировка доки right order is fully filled мне не понятна. is fully filled это он уже заполнен/выполнен, т е нечего еще ему дать
        //здесь смысл в том, что заполняем полностью: это или "is fully filling" или "will be fully filled"
    }

    function fillBoth(uint leftMakeValue, uint leftTakeValue, uint rightTakeValue) internal pure returns (FillResult memory result) {
//        require(rightTakeValue <= leftMakeValue, "fillBoth: unable to fill");//todo это не нужно, параметры будут (uint leftMakeValue, uint leftTakeValue)
        return FillResult(leftMakeValue, leftTakeValue);
    }

    function fillRight(uint leftMakeValue, uint leftTakeValue, uint rightMakeValue, uint rightTakeValue) internal pure returns (FillResult memory result) {
        uint makerValue = LibMath.safeGetPartialAmountFloor(rightTakeValue, leftMakeValue, leftTakeValue);
        require(makerValue <= rightMakeValue, "fillRight: unable to fill");
        return FillResult(rightTakeValue, makerValue);
    }

    function fillLeft(uint leftMakeValue, uint leftTakeValue, uint rightMakeValue, uint rightTakeValue) internal pure returns (FillResult memory result) {
        uint rightTake = LibMath.safeGetPartialAmountFloor(leftTakeValue, rightMakeValue, rightTakeValue);
        require(rightTake <= leftMakeValue, "fillLeft: unable to fill");
        return FillResult(leftMakeValue, leftTakeValue);
    }
}
