// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./LibERC721LazyMint.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

interface IERC721LazyMint is IERC721 {
    event Creators(uint256 tokenId, LibPart.Part[] creators);

    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) external;

    function transferFromOrMint(LibERC721LazyMint.Mint721Data memory data, address from, address to) external;
}
