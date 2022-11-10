// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

library LibLockingMath {
    using SafeMathUpgradeable for uint;

    function divUp(uint a, uint b) internal pure returns (uint) {
        return ((a.sub(1)).div(b)).add(1);
    }
}
