// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

contract NoMetaTxTest {
    function getNonce(address user) external view returns (uint256 nonce) {
        nonce = 0;
    }
}
