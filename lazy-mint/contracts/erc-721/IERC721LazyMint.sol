// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./LibERC721LazyMint.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

interface IERC721LazyMint is IERC721Upgradeable {

    event Creators(
        uint256 tokenId,
        LibPart.Part[] creators
    );

    function mintAndTransfer(
        LibERC721LazyMint.Mint721Data memory data,
        address to
    ) external;

    function transferFromOrMint(
        LibERC721LazyMint.Mint721Data memory data,
        address from,
        address to
    ) external;
}
