// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

contract TestChainId {
    function getChainID() public pure returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }
}
