// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TestERC20 is ERC20Upgradeable {
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function mintTo(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function mint( uint256 amount) external {
        _mint(_msgSender(), amount);
    }

    function init() external initializer {
        __ERC20_init("TestERC20", "TE20");
    }
}
