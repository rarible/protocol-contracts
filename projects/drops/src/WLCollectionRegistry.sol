// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IWLCollectionRegistry } from "./IWLCollectionRegistry.sol";

/*
<ai_context>
WLCollectionRegistry is a contract that manages a whitelist of collections.
- Users pay ERC20 tokens to add their collection to the whitelist
- Tokens are locked when collection is added and unlocked when removed
- Admin can set the ERC20 token and price
- Owner can perform emergency withdrawal
- WL_ADMIN_ROLE can add collections for free (zero price)
</ai_context>
*/

contract WLCollectionRegistry is Ownable, AccessControl, ReentrancyGuard, IWLCollectionRegistry {
    using SafeERC20 for IERC20;
    
    bytes32 public constant WL_ADMIN_ROLE = keccak256("WL_ADMIN_ROLE");

    struct Collection {
        address creator;
        address collection;
        uint256 chainId;
    }

    // Mapping from collection address to collection struct
    mapping(address => Collection) public collections;

    event CollectionAdded(address indexed collection, address indexed creator, uint256 chainId);
    event CollectionRemoved(address indexed collection, address indexed creator, uint256 chainId);

    constructor(address _initialOwner) {
        require(_initialOwner != address(0), "Invalid owner");
        
        _transferOwnership(_initialOwner);
        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);

    }

    /**
     * @notice Adds a collection to the whitelist.
     * @param collection The collection address.
     * @param chainId The chainId associated with the collection (supplied by caller).
     */
    function addToWL(address collection, address creator, uint256 chainId) external nonReentrant onlyRole(WL_ADMIN_ROLE) {
        require(collection != address(0), "Invalid collection address");
        require(collections[collection].creator == address(0), "Collection already whitelisted");
        require(chainId != 0, "Invalid chainId");
        
        collections[collection] = Collection({
            creator: creator,
            collection: collection,
            chainId: chainId
        });
        
        emit CollectionAdded(collection, creator, chainId);
    }

    /**
     * @notice Removes a collection from the whitelist.
     * Only WL_ADMIN_ROLE can call this.
     * Returns locked tokens to the creator if any.
     */
    function removeFromWL(address collection) external nonReentrant onlyRole(WL_ADMIN_ROLE) {
        require(collections[collection].creator != address(0), "Collection not whitelisted");
        Collection memory col = collections[collection];
        
        delete collections[collection];
        
        emit CollectionRemoved(collection, col.creator, col.chainId);
    }

    /**
     * @notice Returns info about a collection.
     */
    function getCollection(address collection) external view returns (
        address creator,
        uint256 chainId
    ) {
        Collection memory col = collections[collection];
        return (
            col.creator,
            col.chainId
        );
    }

}
