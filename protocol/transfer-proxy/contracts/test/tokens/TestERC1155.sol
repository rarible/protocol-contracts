// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

// <ai_context> Simple ERC1155 test token used in transfer-proxy Hardhat tests to verify TransferProxy behavior for ERC1155 assets. </ai_context>

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract TestERC1155 is ERC1155 {
    constructor() ERC1155("") {}

    function mint(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }
}
