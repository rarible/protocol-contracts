// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface INftTransferProxy {
    function erc721safeTransferFrom(IERC721 token, address from, address to, uint256 tokenId) external;

    function erc1155safeTransferFrom(IERC1155 token, address from, address to, uint256 id, uint256 value, bytes calldata data) external;
}
