// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AcceptingReceiver
 * @notice Test contract that accepts native currency.
 * @dev Used to test successful transfers to contracts in NativeSplitPayments.
 */
contract AcceptingReceiver {
    /**
     * @notice Accepts ETH transfers.
     */
    receive() external payable {}
}
