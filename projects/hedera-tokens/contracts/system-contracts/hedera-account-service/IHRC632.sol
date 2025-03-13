// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

/**
 * notice: This interface is only applicable when msg.sender, an EOA, is at the top level of the transaction, 
 *         i.e. the EOA initiates the transaction. It means this interface does not work for a wrapper smart contract.
 */
interface IHRC632 {
    function hbarApprove(address spender, int256 amount) external returns (uint256 responseCode);
    function hbarAllowance(address spender) external returns (int64 responseCode, int256 amount);
}
