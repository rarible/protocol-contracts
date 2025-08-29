// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IWLCollectionRegistry } from "./IWLCollectionRegistry.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract WLCollectionRegistry is Initializable, UUPSUpgradeable, OwnableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, IWLCollectionRegistry {
    using SafeERC20 for IERC20;
    
    bytes32 public constant WL_ADMIN_ROLE = keccak256("WL_ADMIN_ROLE");

    // Errors
    error InvalidOwner();
    error InvalidCollectionAddress();
    error InvalidChainId();
    error CollectionAlreadyWhitelisted();
    error CollectionNotWhitelisted();

    struct Collection {
        address creator;
        address collection;
    }

    // Mapping from chainId to collection address to Collection struct
    mapping(uint256 => mapping(address => Collection)) public collections;

    event CollectionAdded(address indexed collection, address indexed creator, uint256 chainId);
    event CollectionRemoved(address indexed collection, address indexed creator, uint256 chainId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _initialOwner) public initializer {
        if (_initialOwner == address(0)) revert InvalidOwner();
        
        __Ownable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);
        transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
    }

    /**
     * @notice Adds a collection to the whitelist for a specific chainId.
     * @param collection The collection address.
     * @param creator The creator of the collection.
     * @param chainId The chainId associated with the collection.
     */
    function addToWL(address collection, address creator, uint256 chainId) external nonReentrant onlyRole(WL_ADMIN_ROLE) {
        if (collection == address(0)) revert InvalidCollectionAddress();
        if (collections[chainId][collection].creator != address(0)) revert CollectionAlreadyWhitelisted();
        if (chainId == 0) revert InvalidChainId();
        
        collections[chainId][collection] = Collection({
            creator: creator,
            collection: collection
        });
        
        emit CollectionAdded(collection, creator, chainId);
    }

    /**
     * @notice Removes a collection from the whitelist for a specific chainId.
     * Only WL_ADMIN_ROLE can call this.
     * @param collection The collection address.
     * @param chainId The chainId associated with the collection.
     */
    function removeFromWL(address collection, uint256 chainId) external nonReentrant onlyRole(WL_ADMIN_ROLE) {
        if (collections[chainId][collection].creator == address(0)) revert CollectionNotWhitelisted();
        Collection memory col = collections[chainId][collection];
        
        delete collections[chainId][collection];
        
        emit CollectionRemoved(collection, col.creator, chainId);
    }

    /**
     * @notice Returns info about a collection for a specific chainId.
     * @param collection The collection address.
     * @param chainId The chainId associated with the collection.
     * @return creator The creator of the collection.
     */
    function getCollection(address collection, uint256 chainId) external view returns (
        address creator
    ) {
        Collection memory col = collections[chainId][collection];
        return (col.creator);
    }
}