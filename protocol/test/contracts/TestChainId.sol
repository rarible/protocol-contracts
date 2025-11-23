// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract TestChainId {
    function getChainID() public view returns (uint256 id) {
        id = block.chainid;
    }
}
