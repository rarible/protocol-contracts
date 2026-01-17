// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title ItemCollection
/// @notice ERC-721A collection for pack items (Common, Rare, Epic, Legendary, UltraRare)
/// @dev Uses ERC721A for gas-efficient batch minting. Used by NftPool to hold NFTs that can be won from packs.

import {ERC721A} from "erc721a/contracts/ERC721A.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ItemCollection is ERC721A, Ownable {
    string public baseTokenURI;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address initialOwner
    ) ERC721A(name_, symbol_) Ownable(initialOwner) {
        baseTokenURI = baseURI_;
    }

    /// @notice Mint a single token to an address
    /// @param to Recipient address
    function mint(address to) external onlyOwner {
        _mint(to, 1);
    }

    /// @notice Mint multiple tokens to an address (gas-efficient with ERC721A)
    /// @param to Recipient address
    /// @param quantity Number of tokens to mint
    function mintBatch(address to, uint256 quantity) external onlyOwner {
        _mint(to, quantity);
    }

    /// @notice Update the base URI for all tokens
    /// @param newBaseURI New base URI
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    /// @notice Returns the starting token ID (1 instead of 0)
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /// @notice Returns the base URI for token metadata
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    /// @notice Returns the total number of tokens minted
    function totalMinted() external view returns (uint256) {
        return _totalMinted();
    }
}
