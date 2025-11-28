// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

// <ai_context> Simple ERC20 test token used in transfer-proxy Hardhat tests to verify ERC20TransferProxy behavior. </ai_context>

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TestERC20", "T20") {
        _mint(msg.sender, 1000000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
