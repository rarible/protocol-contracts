// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
import "@rarible/exchange-v2/contracts/lib/BpLibrary.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

library LibFeeCalculate {
    using SafeMathUpgradeable for uint;
    using BpLibrary for uint;

    function subFeeInBp(uint value, uint total, uint feeInBp) internal pure returns (uint newValue, uint realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint value, uint fee) internal pure returns (uint newValue, uint realFee) {
        if (value > fee) {
            newValue = value.sub(fee);
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }

}
