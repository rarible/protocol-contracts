// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../../contracts/lib/LibMath.sol";

contract LibMathTest {
    function safeGetPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    ) external pure returns (uint256 partialAmount) {
       return LibMath.safeGetPartialAmountFloor(numerator, denominator, target);
    }
}
