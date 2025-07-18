// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

contract WLCollectionRegistry is Ownable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant WL_ADMIN_ROLE = keccak256("WL_ADMIN_ROLE");

    IERC20 public wlToken;
    uint256 public wlPrice = 1 ether; // Default: 1 token with 18 decimals

    struct Collection {
        address creator;
        address collection;
        uint256 chainId;
        uint256 lockedAmount;
    }

    // Mapping from collection address to collection struct
    mapping(address => Collection) public collections;

    event CollectionAdded(address indexed collection, address indexed creator, uint256 lockedAmount, uint256 chainId);
    event CollectionRemoved(address indexed collection, address indexed creator, uint256 unlockedAmount, uint256 chainId);
    event WLTokenSet(address indexed oldToken, address indexed newToken);
    event WLPriceSet(uint256 oldPrice, uint256 newPrice);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    constructor(address _initialOwner) {
        require(_initialOwner != address(0), "Invalid owner");
        
        _transferOwnership(_initialOwner);
        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);

    }

    function setWLToken(address _wlToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_wlToken != address(0), "Invalid token address");
        address oldToken = address(wlToken);
        wlToken = IERC20(_wlToken);
        emit WLTokenSet(oldToken, _wlToken);
    }

    function setWLPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "Price must be greater than 0");
        uint256 oldPrice = wlPrice;
        wlPrice = _price;
        emit WLPriceSet(oldPrice, _price);
    }

    /**
     * @notice Adds a collection to the whitelist.
     * @param collection The collection address.
     * @param chainId The chainId associated with the collection (supplied by caller).
     */
    function addToWL(address collection, uint256 chainId) external nonReentrant {
        require(collection != address(0), "Invalid collection address");
        require(collections[collection].creator == address(0), "Collection already whitelisted");
        require(address(wlToken) != address(0), "WL token not set");
        require(chainId != 0, "Invalid chainId");
        
        uint256 amountToLock = 0;

        // WL_ADMIN_ROLE can add collections for free
        if (!hasRole(WL_ADMIN_ROLE, msg.sender)) {
            amountToLock = wlPrice;
            wlToken.safeTransferFrom(msg.sender, address(this), amountToLock);
        }
        
        collections[collection] = Collection({
            creator: msg.sender,
            collection: collection,
            chainId: chainId,
            lockedAmount: amountToLock
        });
        
        emit CollectionAdded(collection, msg.sender, amountToLock, chainId);
    }

    /**
     * @notice Removes a collection from the whitelist.
     * Only WL_ADMIN_ROLE can call this.
     * Returns locked tokens to the creator if any.
     */
    function removeFromWL(address collection) external nonReentrant {
        require(collections[collection].creator != address(0), "Collection not whitelisted");
        require(msg.sender == collections[collection].creator, "Not collection creator");
        require(address(wlToken) != address(0), "WL token not set");
        
        Collection memory col = collections[collection];
        
        // Unlock and return tokens to creator if any were locked
        if (col.lockedAmount > 0) {
            wlToken.safeTransfer(col.creator, col.lockedAmount);
        }
        
        delete collections[collection];
        
        emit CollectionRemoved(collection, col.creator, col.lockedAmount, col.chainId);
    }

    /**
     * @notice Returns info about a collection.
     */
    function getCollection(address collection) external view returns (
        address creator,
        uint256 chainId,
        uint256 lockedAmount
    ) {
        Collection memory col = collections[collection];
        return (
            col.creator,
            col.chainId,
            col.lockedAmount
        );
    }

    /**
     * @notice Returns available ERC20 token balance (locked + unclaimed).
     */
    function getAvailableBalance() external view returns (uint256) {
        return wlToken.balanceOf(address(this));
    }

    /**
     * @notice Owner can withdraw ERC20 tokens in emergency.
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdraw(token, amount);
    }
}
