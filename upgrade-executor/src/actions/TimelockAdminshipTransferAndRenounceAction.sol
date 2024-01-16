// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract TimelockAdminshipTransferAndRenounceAction {
    bytes32 public constant TIMELOCK_ADMIN_ROLE = keccak256("TIMELOCK_ADMIN_ROLE");
    
    function perform(address target, address newOwner) public {
        AccessControlUpgradeable(target).grantRole(TIMELOCK_ADMIN_ROLE, newOwner);
        AccessControlUpgradeable(target).renounceRole(TIMELOCK_ADMIN_ROLE, address(this));
    }
}
