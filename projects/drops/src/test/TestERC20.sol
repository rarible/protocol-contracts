// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC20 is ERC20, Ownable {
    
    constructor(string memory name, string memory symbol, uint256 initialSupply, address initialOwner) ERC20(name, symbol) {
        _mint(initialOwner, initialSupply);
        _transferOwnership(initialOwner);
    }

    function mint(address to, uint amount) external onlyOwner  {
        _mint(to, amount);
    }
}
