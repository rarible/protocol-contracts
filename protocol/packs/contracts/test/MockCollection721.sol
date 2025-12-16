// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @ai_context
/// Minimal ERC721 mock used by deployment scripts to deploy multiple collections and seed NftPool.
/// Provides mintBatch() with sequential tokenIds and supports standard approvals/transfers.

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MockCollection721 is ERC721, Ownable {
    uint256 public nextId;

    constructor(string memory name_, string memory symbol_, address initialOwner) ERC721(name_, symbol_) Ownable(initialOwner) {}

    function mintBatch(address to, uint256 count) external onlyOwner {
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = ++nextId;
            _safeMint(to, tokenId);
        }
    }
}