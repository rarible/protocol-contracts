// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20TransferProxy {
    function erc20safeTransferFrom(IERC20 token, address from, address to, uint256 value) external;
}
