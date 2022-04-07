// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestERC721 is ERC721Upgradeable {
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }
}
