// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract TestChainId {
    function getChainID() public pure returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }
}
