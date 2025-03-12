// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

/**
 * notice: This interface is applicable when msg.sender is an EOA or a smart contract and the target address is the same.
 */
interface IHRC906AccountFacade {
    /// Returns the amount of hbar that the spender has been authorized to spend on behalf of the owner.
    /// @param spender The account that has been authorized by the owner.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return amount The amount of hbar that the spender has been authorized to spend on behalf of the owner.
    function hbarAllowance(
        address spender
    ) external returns (int64 responseCode, int256 amount);

    /// Allows spender to withdraw hbars from the owner account multiple times, up to the value amount. If this
    /// function is called again it overwrites the current allowance with the new amount.
    /// @param spender the account address authorized to spend.
    /// @param amount the amount of tokens authorized to spend.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function hbarApprove(
        address spender,
        int256 amount
    ) external returns (int64 responseCode);
}
