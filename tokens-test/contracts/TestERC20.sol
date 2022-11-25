// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TestERC20 is ERC20Upgradeable {
    function mint(address to, uint amount) external {
        _mint(to, amount);
    }

    function init() external {
        __ERC20_init("TestERC20", "TE20");
    }
}
