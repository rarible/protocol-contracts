// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

contract NoGetNonceTxTest {
    function getForce() external view returns (uint256 force) {
        force = 0;
    }
}
