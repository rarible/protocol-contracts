// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

// <ai_context> Simple ERC721 test token used in transfer-proxy Hardhat tests to verify TransferProxy behavior for ERC721 assets. </ai_context>

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestERC721 is ERC721 {
    constructor() ERC721("TestERC721", "T721") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
