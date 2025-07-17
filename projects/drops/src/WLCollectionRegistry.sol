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
    uint256 public wlPrice = 1000000000000000000; // 1 token with 18 decimals by default

    struct Collection {
        address creator;
        address collection;
        uint256 chainId;
        uint256 lockedAmount;
    }

    mapping(address => Collection) public collections;
    mapping(address => bool) public isWhitelisted;

    event CollectionAdded(address indexed collection, address indexed creator, uint256 lockedAmount);
    event CollectionRemoved(address indexed collection, address indexed creator, uint256 unlockedAmount);
    event WLTokenSet(address indexed oldToken, address indexed newToken);
    event WLPriceSet(uint256 oldPrice, uint256 newPrice);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    constructor(address _initialOwner, address _wlToken) {
        require(_initialOwner != address(0), "Invalid owner");
        require(_wlToken != address(0), "Invalid token");
        
        _transferOwnership(_initialOwner);
        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);
        
        wlToken = IERC20(_wlToken);
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

    function addToWL(address collection) external nonReentrant {
        require(collection != address(0), "Invalid collection address");
        require(!isWhitelisted[collection], "Collection already whitelisted");
        require(address(wlToken) != address(0), "WL token not set");
        
        uint256 amountToLock = 0;
        
        // WL_ADMIN_ROLE can add collections for free
        if (!hasRole(WL_ADMIN_ROLE, msg.sender)) {
            amountToLock = wlPrice;
            // Transfer and lock tokens from non-admin users
            wlToken.safeTransferFrom(msg.sender, address(this), amountToLock);
        }
        
        collections[collection] = Collection({
            creator: msg.sender,
            collection: collection,
            chainId: block.chainid,
            lockedAmount: amountToLock
        });
        
        isWhitelisted[collection] = true;
        
        emit CollectionAdded(collection, msg.sender, amountToLock);
    }

    function removeFromWL(address collection) external onlyRole(WL_ADMIN_ROLE) nonReentrant {
        require(isWhitelisted[collection], "Collection not whitelisted");
        
        Collection memory col = collections[collection];
        
        // Unlock and return tokens to creator if any were locked
        if (col.lockedAmount > 0) {
            wlToken.safeTransfer(col.creator, col.lockedAmount);
        }
        
        isWhitelisted[collection] = false;
        delete collections[collection];
        
        emit CollectionRemoved(collection, col.creator, col.lockedAmount);
    }

    function getCollection(address collection) external view returns (
        address creator,
        uint256 chainId,
        uint256 lockedAmount,
        bool whitelisted
    ) {
        Collection memory col = collections[collection];
        return (
            col.creator,
            col.chainId,
            col.lockedAmount,
            isWhitelisted[collection]
        );
    }

    function getAvailableBalance() external view returns (uint256) {
        uint256 balance = wlToken.balanceOf(address(this));
        return balance;
    }
}