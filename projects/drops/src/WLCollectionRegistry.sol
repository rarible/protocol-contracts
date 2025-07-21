// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IWLCollectionRegistry } from "./IWLCollectionRegistry.sol";

contract WLCollectionRegistry is Ownable, AccessControl, ReentrancyGuard, IWLCollectionRegistry {
    using SafeERC20 for IERC20;
    
    bytes32 public constant WL_ADMIN_ROLE = keccak256("WL_ADMIN_ROLE");

    struct Collection {
        address creator;
        address collection;
    }

    // Mapping from chainId to collection address to Collection struct
    mapping(uint256 => mapping(address => Collection)) public collections;

    event CollectionAdded(address indexed collection, address indexed creator, uint256 chainId);
    event CollectionRemoved(address indexed collection, address indexed creator, uint256 chainId);

    constructor(address _initialOwner) {
        require(_initialOwner != address(0), "Invalid owner");
        
        _transferOwnership(_initialOwner);
        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);
    }

    /**
     * @notice Adds a collection to the whitelist for a specific chainId.
     * @param collection The collection address.
     * @param creator The creator of the collection.
     * @param chainId The chainId associated with the collection.
     */
    function addToWL(address collection, address creator, uint256 chainId) external nonReentrant onlyRole(WL_ADMIN_ROLE) {
        require(collection != address(0), "Invalid collection address");
        require(collections[chainId][collection].creator == address(0), "Collection already whitelisted on this chain");
        require(chainId != 0, "Invalid chainId");
        
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
        require(collections[chainId][collection].creator != address(0), "Collection not whitelisted on this chain");
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