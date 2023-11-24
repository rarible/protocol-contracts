// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title  A root contract from which it execute upgrades
/// @notice Does not contain upgrade logic itself, only the means to call upgrade contracts and execute them
/// @dev    We use these upgrade contracts as they allow multiple actions to take place in an upgrade
///         and for these actions to interact. However because we are delegatecalling into these upgrade
///         contracts, it's important that these upgrade contract do not touch or modify contract state.
contract UpgradeExecutor is Initializable, AccessControlUpgradeable, ReentrancyGuard {
    using Address for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    /// @notice Emitted when an upgrade execution occurs
    event UpgradeExecuted(address indexed upgrade, uint256 value, bytes data);

    /// @notice Initialise the upgrade executor
    /// @param admin The admin who can update other roles, and itself - ADMIN_ROLE
    /// @param executors Can call the execute function - EXECUTOR_ROLE
    function initialize(address admin, address[] memory executors) public initializer {
        require(admin != address(0), "UpgradeExecutor: zero admin");

        __AccessControl_init();

        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(EXECUTOR_ROLE, ADMIN_ROLE);

        _setupRole(ADMIN_ROLE, admin);
        for (uint256 i = 0; i < executors.length; ++i) {
            _setupRole(EXECUTOR_ROLE, executors[i]);
        }
    }

    /// @notice Execute an upgrade by delegate calling an upgrade contract
    /// @dev    Only executor can call this. Since we're using a delegatecall here the Upgrade contract
    ///         will have access to the state of this contract - including the roles. Only upgrade contracts
    ///         that do not touch local state should be used.
    function execute(address upgrade, bytes memory upgradeCallData)
        public
        payable
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
    {
        // OZ Address library check if the address is a contract and bubble up inner revert reason
        address(upgrade).functionDelegateCall(
            upgradeCallData, "UpgradeExecutor: inner delegate call failed without reason"
        );

        emit UpgradeExecuted(upgrade, msg.value, upgradeCallData);
    }
}
