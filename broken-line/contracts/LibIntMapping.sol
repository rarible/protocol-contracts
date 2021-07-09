// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts-upgradeable/math/SignedSafeMathUpgradeable.sol";

library LibIntMapping {
    using SignedSafeMathUpgradeable for int;

    function addToItem(mapping(uint => int) storage map, uint key, int value) internal {
        map[key] = map[key].add(value);
    }

    function subFromItem(mapping(uint => int) storage map, uint key, int value) internal {
        map[key] = map[key].sub(value);
    }
}
