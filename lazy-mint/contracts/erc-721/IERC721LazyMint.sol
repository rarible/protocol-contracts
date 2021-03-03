// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./LibERC721LazyMint.sol";

interface IERC721LazyMint is IERC721Upgradeable {
    function mintAndTransfer(
        LibERC721LazyMint.Mint721Data memory data,
        address to
    ) external;
}
