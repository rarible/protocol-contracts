// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NativeSplitPayments
 * @notice Minimal EVM smart-contract that allows any user to atomically split 
 *         a native currency payment (ETH/MATIC/etc) to multiple recipients in a single transaction.
 * @dev Provides:
 *      - `pay2`: specialized method for exactly 2 recipients
 *      - `payMany`: generic method for 1..6 recipients
 *      
 *      The contract is stateless, permissionless, and does not hold funds.
 */
contract NativeSplitPayments {
    // ========= Events =========

    /**
     * @notice Emitted for each successful payout.
     * @param payer The address that initiated the payment.
     * @param to The recipient address.
     * @param amount The amount transferred to the recipient.
     */
    event Payment(address indexed payer, address indexed to, uint256 amount);

    // ========= Custom Errors =========

    /// @notice Thrown when msg.value == 0.
    error InvalidValue();

    /// @notice Thrown when any payout amount is 0.
    error InvalidAmount();

    /// @notice Thrown when recipients.length != amounts.length.
    error LengthMismatch();

    /// @notice Thrown when payMany length is 0 or > 6.
    error InvalidLength();

    /// @notice Thrown when any recipient is address(0).
    error ZeroAddress();

    /// @notice Thrown when any recipient is address(this).
    error SelfAddress();

    /// @notice Thrown when sum of amounts does not equal msg.value.
    error InvalidTotal();

    /// @notice Thrown when a native transfer via call fails.
    /// @param to The address that failed to receive.
    /// @param amount The amount that was attempted to transfer.
    error TransferFailed(address to, uint256 amount);

    // ========= Deposit Prevention =========

    /**
     * @notice Rejects any direct ETH deposits.
     */
    receive() external payable {
        revert InvalidValue();
    }

    /**
     * @notice Rejects any calls to unknown selectors with value.
     */
    fallback() external payable {
        revert InvalidValue();
    }

    // ========= Public Functions =========

    /**
     * @notice Splits msg.value into 2 exact payouts.
     * @param to1 First recipient address.
     * @param a1 Amount to send to first recipient.
     * @param to2 Second recipient address.
     * @param a2 Amount to send to second recipient.
     */
    function pay2(
        address to1,
        uint256 a1,
        address to2,
        uint256 a2
    ) external payable {
        // Validate msg.value
        if (msg.value == 0) {
            revert InvalidValue();
        }

        // Validate amounts
        if (a1 == 0 || a2 == 0) {
            revert InvalidAmount();
        }

        // Validate addresses
        _validateAddress(to1);
        _validateAddress(to2);

        // Validate total matches msg.value
        if (a1 + a2 != msg.value) {
            revert InvalidTotal();
        }

        // Execute transfers
        _transfer(to1, a1);
        _transfer(to2, a2);

        // Emit events
        emit Payment(msg.sender, to1, a1);
        emit Payment(msg.sender, to2, a2);
    }

    /**
     * @notice Splits msg.value into N exact payouts (N = 1..6).
     * @param recipients Array of recipient addresses.
     * @param amounts Array of amounts corresponding to each recipient.
     */
    function payMany(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        uint256 length = recipients.length;

        // Validate msg.value
        if (msg.value == 0) {
            revert InvalidValue();
        }

        // Validate array lengths match
        if (length != amounts.length) {
            revert LengthMismatch();
        }

        // Validate array length is 1..6
        if (length == 0 || length > 6) {
            revert InvalidLength();
        }

        // Validate amounts, addresses, and calculate total
        uint256 total = 0;
        for (uint256 i = 0; i < length; ) {
            if (amounts[i] == 0) {
                revert InvalidAmount();
            }
            _validateAddress(recipients[i]);
            total += amounts[i];
            unchecked {
                ++i;
            }
        }

        // Validate total matches msg.value
        if (total != msg.value) {
            revert InvalidTotal();
        }

        // Execute transfers and emit events
        for (uint256 i = 0; i < length; ) {
            _transfer(recipients[i], amounts[i]);
            emit Payment(msg.sender, recipients[i], amounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    // ========= Internal Functions =========

    /**
     * @dev Validates that the address is not zero and not this contract.
     * @param to The address to validate.
     */
    function _validateAddress(address to) internal view {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        if (to == address(this)) {
            revert SelfAddress();
        }
    }

    /**
     * @dev Transfers native currency using low-level call.
     * @param to The recipient address.
     * @param amount The amount to transfer.
     */
    function _transfer(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) {
            revert TransferFailed(to, amount);
        }
    }
}
