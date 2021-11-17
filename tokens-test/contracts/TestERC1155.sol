// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC1155 is ERC1155, Ownable {
    constructor(string memory uri) ERC1155(uri) {

    }

    function mint(address account, uint256 tokenId, uint256 amount, bytes memory data) external {
        _mint(account, tokenId, amount, data);
    }
}
