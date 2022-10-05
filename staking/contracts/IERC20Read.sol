// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

/**
 * @dev Interface of the ERC20 read.
 */
interface IERC20Read {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    function name() external view returns (string memory);

    function decimals() external view returns (uint8);

    function symbol() external view returns (string memory);
}
