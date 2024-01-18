// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

contract NoMetaTxTest {
    function getNonce(address user) external view returns (uint256 nonce) {
        nonce = 0;
    }
}
