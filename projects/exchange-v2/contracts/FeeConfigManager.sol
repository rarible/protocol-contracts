// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title FeeConfigManager
 * @dev Manages fee configuration for collections - allows ignoring fees or overriding fee bps per collection
 */
abstract contract FeeConfigManager is OwnableUpgradeable {
    /// @dev Role identifier for managers who can modify fee settings
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /// @dev Maximum basis points (100%)
    uint16 public constant MAX_BPS = 10000;

    /// @dev Collections for which fees are ignored
    mapping(address => bool) public ignoredFeeCollections;

    /// @dev Fee override in basis points per collection (0..10000)
    mapping(address => uint16) public feeOverrideBps;

    /// @dev Default fee in basis points
    uint16 public defaultFeeBps;

    /// @dev Mapping of addresses with MANAGER_ROLE
    mapping(address => bool) private _managers;

    /// @dev Emitted when a collection's fee ignored status changes
    event FeeIgnoredSet(address indexed collection, bool ignored);

    /// @dev Emitted when a collection's fee override is set
    event FeeOverrideSet(address indexed collection, uint16 bps);

    /// @dev Emitted when a collection's fee override is cleared
    event FeeOverrideCleared(address indexed collection);

    /// @dev Emitted when default fee bps is changed
    event DefaultFeeBpsSet(uint16 oldValue, uint16 newValue);

    /// @dev Emitted when a manager's status changes
    event ManagerStatusChanged(address indexed manager, bool indexed status);

    /**
     * @dev Modifier to restrict access to owner or manager
     */
    modifier onlyOwnerOrManager() {
        require(
            owner() == _msgSender() || _managers[_msgSender()],
            "FeeConfigManager: caller is not owner or manager"
        );
        _;
    }

    function __FeeConfigManager_init_unchained() internal initializer {
    }

    /**
     * @notice Grant manager role to an address
     * @param manager Address to grant manager role
     */
    function addManager(address manager) external onlyOwner {
        _managers[manager] = true;
        emit ManagerStatusChanged(manager, true);
    }

    /**
     * @notice Revoke manager role from an address
     * @param manager Address to revoke manager role
     */
    function removeManager(address manager) external onlyOwner {
        _managers[manager] = false;
        emit ManagerStatusChanged(manager, false);
    }

    /**
     * @notice Check if an address has manager role
     * @param account Address to check
     * @return bool True if the address has manager role
     */
    function isManager(address account) external view returns (bool) {
        return _managers[account];
    }

    /**
     * @notice Set whether a collection should have fees ignored
     * @param collection The collection address
     * @param ignored True to ignore fees, false otherwise
     */
    function setIgnoredFee(address collection, bool ignored) external onlyOwnerOrManager {
        ignoredFeeCollections[collection] = ignored;
        emit FeeIgnoredSet(collection, ignored);
    }

    /**
     * @notice Set fee override in basis points for a collection
     * @param collection The collection address
     * @param bps Fee in basis points (0..10000)
     */
    function setFeeOverrideBps(address collection, uint16 bps) external onlyOwnerOrManager {
        require(bps <= MAX_BPS, "FeeConfigManager: bps exceeds maximum");
        feeOverrideBps[collection] = bps;
        emit FeeOverrideSet(collection, bps);
    }

    /**
     * @notice Clear fee override for a collection
     * @param collection The collection address
     */
    function clearFeeOverrideBps(address collection) external onlyOwnerOrManager {
        delete feeOverrideBps[collection];
        emit FeeOverrideCleared(collection);
    }

    /**
     * @notice Set the default fee in basis points
     * @param bps Default fee in basis points (0..10000)
     */
    function setDefaultFeeBps(uint16 bps) external onlyOwnerOrManager {
        require(bps <= MAX_BPS, "FeeConfigManager: bps exceeds maximum");
        emit DefaultFeeBpsSet(defaultFeeBps, bps);
        defaultFeeBps = bps;
    }

    // No gap - storage slots carved from ExchangeV2Core's gap for safe upgrades
}

