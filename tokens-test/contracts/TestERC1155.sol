// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract TestERC1155 is ERC1155 {

    constructor() ERC1155("uri"){

    }
    
    function mint(address to, uint tokenId, uint amount) external {
        _mint(to, tokenId, amount, "");
    }

    function batchSafeTransferFrom(
        address[] memory froms,
        address[] memory tos,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        require(froms.length == tos.length, "wrong length 1");
        require(tos.length == ids.length, "wrong length 2");
        require(ids.length == amounts.length, "wrong length 3");

        for (uint i = 0; i < froms.length; i ++) {
            safeTransferFrom(froms[i], tos[i], ids[i], amounts[i], "");
        }
    }

}
