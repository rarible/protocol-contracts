// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

contract NoGetNonceTxTest {
    function getForce() external view returns (uint256 force) {
        force = 0;
    }
}
