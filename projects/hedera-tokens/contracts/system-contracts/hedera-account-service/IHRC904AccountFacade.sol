// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

/**
 * notice: This interface is applicable when msg.sender is an EOA or a smart contract and the target address is the same.
 */
interface IHRC904AccountFacade {
    /// @notice Enables or disables automatic token associations for the calling account
    /// @notice Responsible service: HAS
    /// @param enableAutoAssociations True to enable unlimited automatic associations, false to disable
    /// @return responseCode The response code indicating the result of the operation
    function setUnlimitedAutomaticAssociations(bool enableAutoAssociations) external returns (int64 responseCode);
}