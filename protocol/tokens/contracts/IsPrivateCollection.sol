// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

contract IsPrivateCollection {
    /// @dev true if collection is private, false if public
    bool isPrivate;

    uint256[49] private __gap;
}