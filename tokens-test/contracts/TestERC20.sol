// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TestERC20 is ERC20Upgradeable {
    function mint(address to, uint amount) external {
        _mint(to, amount);
    }

    function approveFrom(address from, address spender, uint256 amount) public returns (bool) {
        _approve(from, spender, amount);
        return true;
    }
}
