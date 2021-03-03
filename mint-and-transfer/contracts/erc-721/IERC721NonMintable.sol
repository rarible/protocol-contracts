// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./LibERC721NonMinted.sol";

contract IERC721NonMintable is IERC721Upgradeable {
    function mintAndTransfer(
        LibERC721NonMinted.Mint721Data memory data,
        address to
    ) external;
}
