// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

//todo make safe (check rounding errors?)
library LibMath {
    using SafeMathUpgradeable for uint;

    function safeGetPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    ) internal pure returns (uint256 partialAmount) {
        partialAmount = numerator.mul(target).div(denominator);
    }

    function safeGetPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    ) internal pure returns (uint256 partialAmount) {
        partialAmount = numerator.mul(target).add(denominator.sub(1)).div(denominator);
    }
}
