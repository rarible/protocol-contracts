// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RevertingReceiver
 * @notice Test contract that always reverts when receiving native currency.
 * @dev Used to test TransferFailed error handling in NativeSplitPayments.
 */
contract RevertingReceiver {
    /**
     * @notice Always reverts when receiving ETH.
     */
    receive() external payable {
        revert("RevertingReceiver: rejected");
    }

    /**
     * @notice Always reverts on any call with value.
     */
    fallback() external payable {
        revert("RevertingReceiver: rejected");
    }
}
