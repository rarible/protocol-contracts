// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

contract NoGetNonceTxTest {
    function getForce() external view returns (uint256 force) {
        force = 0;
    }
}
