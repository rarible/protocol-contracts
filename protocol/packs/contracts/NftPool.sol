// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721HolderUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title NftPool
/// @notice Single pool holding all NFTs, organized by pool levels based on price ranges.
/// @dev Collections are assigned to a pool level by floor price.
///      NFTs are tracked per collection; pools maintain aggregate counts (no per-NFT migration on floor change).
contract NftPool is
    Initializable,
    ERC721HolderUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable
{
    // -----------------------
    // Types
    // -----------------------

    /// @dev Pool levels ordered from common to rare
    enum PoolLevel {
        Common,
        Rare,
        Epic,
        Legendary,
        UltraRare
    }

    /// @dev Pool price range configuration + collections + aggregate NFT count
    struct PoolInfo {
        uint256 lowPrice;      // Minimum floor price (inclusive)
        uint256 highPrice;     // Maximum floor price (exclusive, except UltraRare which usually has no upper bound)
        address[] collections; // Collections currently assigned to this pool
        uint256 totalNfts;     // Total NFTs (across all collections) in this pool
    }

    /// @dev Per-collection configuration and pool membership
    /// @notice "Allowed" is derived from poolIndexPlusOne != 0
    struct CollectionInfo {
        uint256 floorPrice;        // Current floor price in wei
        PoolLevel poolLevel;       // Logical pool level for this collection
        uint256 poolIndexPlusOne;  // 1-based index in PoolInfo.collections, 0 = not assigned / not allowed
    }

    // -----------------------
    // Storage
    // -----------------------

    /// @dev Pool level => price range configuration + collections + aggregate count
    mapping(PoolLevel => PoolInfo) private _poolInfo;

    /// @dev Collection address => collection info
    mapping(address => CollectionInfo) private _collectionInfo;

    /// @dev Per-collection NFTs held by the pool (only tokenIds, collection is the key)
    mapping(address => uint256[]) private _collectionTokens;

    /// @dev Index of a tokenId inside _collectionTokens[collection] (1-based, 0 = not tracked)
    mapping(address => mapping(uint256 => uint256)) private _collectionTokenIndexPlusOne;

    // -----------------------
    // Roles
    // -----------------------

    bytes32 public constant POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE");

    // -----------------------
    // Events
    // -----------------------

    event Deposited(address indexed collection, uint256 indexed tokenId, PoolLevel indexed poolLevel);
    event Withdrawn(address indexed to, address indexed collection, uint256 indexed tokenId, PoolLevel poolLevel);

    event PoolInfoUpdated(PoolLevel indexed poolLevel, uint256 lowPrice, uint256 highPrice);

    event CollectionConfigured(address indexed collection, bool allowed, uint256 floorPrice);
    event CollectionFloorPriceUpdated(address indexed collection, uint256 oldPrice, uint256 newPrice);
    event CollectionAllowedUpdated(address indexed collection, bool allowed);

    event RescuedNft(address indexed to, address indexed collection, uint256 indexed tokenId);

    // -----------------------
    // Errors
    // -----------------------

    error CollectionNotAllowed();
    error NotInPool();
    error ZeroAddress();
    error ArrayLengthMismatch();
    error LevelEmpty(PoolLevel level);
    error FloorPriceNotSet();
    error InvalidPriceRange();
    error IndexOutOfBounds();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // -----------------------
    // Init
    // -----------------------

    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();

        __ERC721Holder_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(POOL_MANAGER_ROLE, initialOwner);

        // Set default price ranges (in wei)
        // Common:    0 - 0.5 ETH
        // Rare:    0.5 - 2 ETH
        // Epic:      2 - 10 ETH
        // Legendary: 10 - 50 ETH
        // UltraRare: 50+ ETH (no practical upper bound)
        _poolInfo[PoolLevel.Common].lowPrice = 0;
        _poolInfo[PoolLevel.Common].highPrice = 0.5 ether;

        _poolInfo[PoolLevel.Rare].lowPrice = 0.5 ether;
        _poolInfo[PoolLevel.Rare].highPrice = 2 ether;

        _poolInfo[PoolLevel.Epic].lowPrice = 2 ether;
        _poolInfo[PoolLevel.Epic].highPrice = 10 ether;

        _poolInfo[PoolLevel.Legendary].lowPrice = 10 ether;
        _poolInfo[PoolLevel.Legendary].highPrice = 50 ether;

        _poolInfo[PoolLevel.UltraRare].lowPrice = 50 ether;
        _poolInfo[PoolLevel.UltraRare].highPrice = type(uint256).max;
    }

    // -----------------------
    // Admin: Pool Configuration
    // -----------------------

    /// @notice Set price range for a pool level
    /// @param level The pool level to configure
    /// @param lowPrice Minimum floor price (inclusive)
    /// @param highPrice Maximum floor price (exclusive)
    function setPoolInfo(PoolLevel level, uint256 lowPrice, uint256 highPrice) external onlyOwner {
        if (lowPrice >= highPrice) revert InvalidPriceRange();

        PoolInfo storage info = _poolInfo[level];
        info.lowPrice = lowPrice;
        info.highPrice = highPrice;

        emit PoolInfoUpdated(level, lowPrice, highPrice);
    }

    /// @notice Batch set all pool price ranges
    function setAllPoolInfo(
        uint256 commonLow,
        uint256 commonHigh,
        uint256 rareLow,
        uint256 rareHigh,
        uint256 epicLow,
        uint256 epicHigh,
        uint256 legendaryLow,
        uint256 legendaryHigh,
        uint256 ultraRareLow,
        uint256 ultraRareHigh
    ) external onlyOwner {
        if (commonLow >= commonHigh) revert InvalidPriceRange();
        if (rareLow >= rareHigh) revert InvalidPriceRange();
        if (epicLow >= epicHigh) revert InvalidPriceRange();
        if (legendaryLow >= legendaryHigh) revert InvalidPriceRange();
        if (ultraRareLow >= ultraRareHigh) revert InvalidPriceRange();

        _poolInfo[PoolLevel.Common].lowPrice = commonLow;
        _poolInfo[PoolLevel.Common].highPrice = commonHigh;

        _poolInfo[PoolLevel.Rare].lowPrice = rareLow;
        _poolInfo[PoolLevel.Rare].highPrice = rareHigh;

        _poolInfo[PoolLevel.Epic].lowPrice = epicLow;
        _poolInfo[PoolLevel.Epic].highPrice = epicHigh;

        _poolInfo[PoolLevel.Legendary].lowPrice = legendaryLow;
        _poolInfo[PoolLevel.Legendary].highPrice = legendaryHigh;

        _poolInfo[PoolLevel.UltraRare].lowPrice = ultraRareLow;
        _poolInfo[PoolLevel.UltraRare].highPrice = ultraRareHigh;

        emit PoolInfoUpdated(PoolLevel.Common, commonLow, commonHigh);
        emit PoolInfoUpdated(PoolLevel.Rare, rareLow, rareHigh);
        emit PoolInfoUpdated(PoolLevel.Epic, epicLow, epicHigh);
        emit PoolInfoUpdated(PoolLevel.Legendary, legendaryLow, legendaryHigh);
        emit PoolInfoUpdated(PoolLevel.UltraRare, ultraRareLow, ultraRareHigh);
    }

    // -----------------------
    // Internal: Collection Pool Membership
    // -----------------------

    function _addCollectionToPool(address collection, PoolLevel level) internal {
        PoolInfo storage pool = _poolInfo[level];
        pool.collections.push(collection);

        uint256 indexPlusOne = pool.collections.length;
        CollectionInfo storage info = _collectionInfo[collection];
        info.poolIndexPlusOne = indexPlusOne;
        info.poolLevel = level;
    }

    function _removeCollectionFromPool(address collection, PoolLevel level) internal {
        CollectionInfo storage info = _collectionInfo[collection];
        uint256 indexPlusOne = info.poolIndexPlusOne;
        if (indexPlusOne == 0) {
            return; // already not assigned
        }

        PoolInfo storage pool = _poolInfo[level];
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = pool.collections.length - 1;

        if (index != lastIndex) {
            address lastCollection = pool.collections[lastIndex];
            pool.collections[index] = lastCollection;

            CollectionInfo storage lastInfo = _collectionInfo[lastCollection];
            lastInfo.poolIndexPlusOne = index + 1;
            // lastInfo.poolLevel stays 'level'
        }

        pool.collections.pop();
        info.poolIndexPlusOne = 0;
        // info.poolLevel will be updated by caller (_setCollectionConfig)
    }

    /// @dev Core function to configure collection, used by all public setters
    function _setCollectionConfig(
        address collection,
        bool allowed,
        uint256 newFloorPrice
    ) internal {
        if (allowed && newFloorPrice == 0) revert FloorPriceNotSet();

        CollectionInfo storage info = _collectionInfo[collection];

        bool wasAllowed = info.poolIndexPlusOne != 0;
        uint256 oldPrice = info.floorPrice;
        PoolLevel oldLevel = info.poolLevel;
        uint256 tokensCount = _collectionTokens[collection].length;

        info.floorPrice = newFloorPrice;

        PoolLevel newLevel = _getPoolLevelForPrice(newFloorPrice);

        // membership transitions
        if (wasAllowed) {
            if (!allowed) {
                // allowed -> not allowed
                _removeCollectionFromPool(collection, oldLevel);
                if (tokensCount > 0) {
                    _poolInfo[oldLevel].totalNfts -= tokensCount;
                }
            } else {
                // allowed -> allowed
                if (newLevel != oldLevel) {
                    _removeCollectionFromPool(collection, oldLevel);
                    _addCollectionToPool(collection, newLevel);
                    if (tokensCount > 0) {
                        _poolInfo[oldLevel].totalNfts -= tokensCount;
                        _poolInfo[newLevel].totalNfts += tokensCount;
                    }
                }
            }
        } else {
            if (allowed) {
                // not allowed -> allowed
                _addCollectionToPool(collection, newLevel);
                if (tokensCount > 0) {
                    _poolInfo[newLevel].totalNfts += tokensCount;
                }
            }
            // not allowed -> not allowed : no pool membership
        }

        // logical level always updated
        info.poolLevel = newLevel;

        emit CollectionConfigured(collection, allowed, newFloorPrice);

        if (oldPrice != newFloorPrice) {
            emit CollectionFloorPriceUpdated(collection, oldPrice, newFloorPrice);
        }

        if (wasAllowed != allowed) {
            emit CollectionAllowedUpdated(collection, allowed);
        }
    }

    // -----------------------
    // Admin: Collection Configuration
    // -----------------------

    /// @notice Configure a collection (allowed status and floor price)
    /// @param collection NFT collection address
    /// @param allowed Whether deposits are accepted (true => collection is included in a pool)
    /// @param floorPrice Current floor price in wei
    function configureCollection(
        address collection,
        bool allowed,
        uint256 floorPrice
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        _setCollectionConfig(collection, allowed, floorPrice);
    }

    /// @notice Batch configure multiple collections
    function configureCollections(
        address[] calldata collections,
        bool[] calldata allowedList,
        uint256[] calldata floorPrices
    ) external onlyOwner {
        if (collections.length != allowedList.length || collections.length != floorPrices.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < collections.length; i++) {
            if (collections[i] == address(0)) revert ZeroAddress();
            _setCollectionConfig(collections[i], allowedList[i], floorPrices[i]);
        }
    }

    /// @notice Update floor price for a collection
    /// @dev Pool level and aggregate NFT counts are adjusted without per-NFT migration
    function setCollectionFloorPrice(address collection, uint256 newPrice) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        CollectionInfo storage info = _collectionInfo[collection];
        bool allowed = info.poolIndexPlusOne != 0;
        _setCollectionConfig(collection, allowed, newPrice);
    }

    /// @notice Batch update floor prices for multiple collections
    function setCollectionFloorPrices(
        address[] calldata collections,
        uint256[] calldata floorPrices
    ) external onlyOwner {
        if (collections.length != floorPrices.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < collections.length; i++) {
            if (collections[i] == address(0)) revert ZeroAddress();
            CollectionInfo storage info = _collectionInfo[collections[i]];
            bool allowed = info.poolIndexPlusOne != 0;
            _setCollectionConfig(collections[i], allowed, floorPrices[i]);
        }
    }

    /// @notice Update allowed status for a collection
    /// @dev "Allowed" is derived from pool membership: if allowed, collection is assigned to a pool
    function setCollectionAllowed(address collection, bool allowed) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        CollectionInfo storage info = _collectionInfo[collection];
        uint256 floorPrice = info.floorPrice;
        _setCollectionConfig(collection, allowed, floorPrice);
    }

    // -----------------------
    // Internal: NFT Bookkeeping
    // -----------------------

    function _addCollectionToken(address collection, uint256 tokenId, PoolLevel level) internal {
        // protect from duplicates
        if (_collectionTokenIndexPlusOne[collection][tokenId] != 0) {
            return;
        }

        uint256[] storage tokens = _collectionTokens[collection];
        tokens.push(tokenId);
        _collectionTokenIndexPlusOne[collection][tokenId] = tokens.length;

        // Only count NFTs of allowed collections in pool totals
        if (_collectionInfo[collection].poolIndexPlusOne != 0) {
            _poolInfo[level].totalNfts += 1;
        }

        emit Deposited(collection, tokenId, level);
    }

    function _removeCollectionToken(address collection, uint256 tokenId, PoolLevel level) internal {
        uint256 indexPlusOne = _collectionTokenIndexPlusOne[collection][tokenId];
        if (indexPlusOne == 0) revert NotInPool();

        uint256[] storage tokens = _collectionTokens[collection];
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = tokens.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = tokens[lastIndex];
            tokens[index] = lastTokenId;
            _collectionTokenIndexPlusOne[collection][lastTokenId] = index + 1;
        }

        tokens.pop();
        delete _collectionTokenIndexPlusOne[collection][tokenId];

        // Adjust totalNfts only if collection is currently allowed
        if (_collectionInfo[collection].poolIndexPlusOne != 0) {
            _poolInfo[level].totalNfts -= 1;
        }
    }

    // -----------------------
    // Pool Operations
    // -----------------------

    /// @notice Deposit an NFT into the pool
    /// @dev NFT is assigned to pool level based on collection's current floor price
    function deposit(address collection, uint256 tokenId) external {
        CollectionInfo storage info = _collectionInfo[collection];
        if (info.poolIndexPlusOne == 0) revert CollectionNotAllowed();
        if (info.floorPrice == 0) revert FloorPriceNotSet();

        IERC721(collection).safeTransferFrom(msg.sender, address(this), tokenId);
        // _addCollectionToken is called in onERC721Received
    }

    /// @notice Transfer an NFT out of the pool
    function transferNft(
        address collection,
        address to,
        uint256 tokenId
    ) external onlyRole(POOL_MANAGER_ROLE) {
        CollectionInfo storage info = _collectionInfo[collection];
        PoolLevel level = info.poolLevel;

        _removeCollectionToken(collection, tokenId, level);

        IERC721(collection).safeTransferFrom(address(this), to, tokenId);

        emit Withdrawn(to, collection, tokenId, level);
    }

    /// @notice Rescue an NFT that was sent incorrectly and is not tracked
    function rescueNft(
        address collection,
        address to,
        uint256 tokenId
    ) external onlyOwner {
        require(
            _collectionTokenIndexPlusOne[collection][tokenId] == 0,
            "NftPool: NFT is tracked"
        );
        require(IERC721(collection).ownerOf(tokenId) == address(this), "NftPool: not owned");

        IERC721(collection).safeTransferFrom(address(this), to, tokenId);

        emit RescuedNft(to, collection, tokenId);
    }

    // -----------------------
    // ERC721 Receiver
    // -----------------------

    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 tokenId,
        bytes memory /* data */
    ) public virtual override returns (bytes4) {
        address collection = msg.sender;
        CollectionInfo storage info = _collectionInfo[collection];

        // Only track if collection is configured (in some pool) and price > 0
        if (info.poolIndexPlusOne != 0 && info.floorPrice > 0) {
            _addCollectionToken(collection, tokenId, info.poolLevel);
        }

        return this.onERC721Received.selector;
    }

    // -----------------------
    // Internal: Pool Level Logic
    // -----------------------

    /// @dev Determine pool level based on floor price using configured ranges
    function _getPoolLevelForPrice(uint256 price) internal view returns (PoolLevel) {
        // UltraRare
        PoolInfo storage ultra = _poolInfo[PoolLevel.UltraRare];
        if (price >= ultra.lowPrice && price < ultra.highPrice) {
            return PoolLevel.UltraRare;
        }

        // Legendary
        PoolInfo storage legendary = _poolInfo[PoolLevel.Legendary];
        if (price >= legendary.lowPrice && price < legendary.highPrice) {
            return PoolLevel.Legendary;
        }

        // Epic
        PoolInfo storage epic = _poolInfo[PoolLevel.Epic];
        if (price >= epic.lowPrice && price < epic.highPrice) {
            return PoolLevel.Epic;
        }

        // Rare
        PoolInfo storage rare = _poolInfo[PoolLevel.Rare];
        if (price >= rare.lowPrice && price < rare.highPrice) {
            return PoolLevel.Rare;
        }

        // Default / fallback
        return PoolLevel.Common;
    }

    // -----------------------
    // Selection (for PackManager)
    // -----------------------

    /// @notice Get count of NFTs at a pool level
    function getPoolLevelSize(PoolLevel level) external view returns (uint256) {
        return _poolInfo[level].totalNfts;
    }

    /// @notice Get NFT at global index within a pool level (0..size-1)
    /// @dev Walks collections and per-collection token arrays; O(number of collections in pool).
    function getPoolLevelNftAt(
        PoolLevel level,
        uint256 index
    ) external view returns (address collection, uint256 tokenId) {
        PoolInfo storage pool = _poolInfo[level];
        if (index >= pool.totalNfts) revert IndexOutOfBounds();

        uint256 remaining = index;
        address[] storage collections = pool.collections;
        uint256 len = collections.length;

        for (uint256 i = 0; i < len; i++) {
            address coll = collections[i];
            uint256 count = _collectionTokens[coll].length;
            if (count == 0) continue;

            if (remaining < count) {
                collection = coll;
                tokenId = _collectionTokens[coll][remaining];
                return (collection, tokenId);
            }

            remaining -= count;
        }

        revert NotInPool(); // Should not happen if accounting is correct
    }

    /// @notice Select and transfer a random NFT from a pool level
    /// @dev Uses pool.totalNfts and walks collections; no per-NFT migration on floor price changes.
    function selectAndTransferFromLevel(
        PoolLevel level,
        uint256 randomValue,
        address to
    ) external onlyRole(POOL_MANAGER_ROLE) returns (address collection, uint256 tokenId) {
        PoolInfo storage pool = _poolInfo[level];
        uint256 total = pool.totalNfts;
        if (total == 0) revert LevelEmpty(level);

        uint256 randomIndex = randomValue % total;
        uint256 remaining = randomIndex;

        address[] storage collections = pool.collections;
        uint256 len = collections.length;

        for (uint256 i = 0; i < len; i++) {
            address coll = collections[i];
            uint256 count = _collectionTokens[coll].length;
            if (count == 0) continue;

            if (remaining < count) {
                uint256 localIndex = remaining;
                uint256[] storage tokens = _collectionTokens[coll];
                tokenId = tokens[localIndex];
                collection = coll;

                _removeCollectionToken(coll, tokenId, level);
                IERC721(coll).safeTransferFrom(address(this), to, tokenId);

                emit Withdrawn(to, coll, tokenId, level);
                return (collection, tokenId);
            }

            remaining -= count;
        }

        // If we get here, accounting is inconsistent
        revert LevelEmpty(level);
    }

    // -----------------------
    // Views
    // -----------------------

    /// @notice Get total NFTs across all pools
    function totalPoolSize() external view returns (uint256 total) {
        for (uint256 i = 0; i <= uint256(PoolLevel.UltraRare); i++) {
            total += _poolInfo[PoolLevel(i)].totalNfts;
        }
    }

    /// @notice Get pool price range configuration
    function getPoolInfo(
        PoolLevel level
    ) external view returns (uint256 lowPrice, uint256 highPrice) {
        PoolInfo storage info = _poolInfo[level];
        return (info.lowPrice, info.highPrice);
    }

    /// @notice Get collections currently assigned to a pool level
    function getPoolCollections(PoolLevel level) external view returns (address[] memory) {
        return _poolInfo[level].collections;
    }

    /// @notice Get collection info
    function getCollectionInfo(
        address collection
    ) external view returns (bool allowed, uint256 floorPrice, PoolLevel poolLevel) {
        CollectionInfo storage info = _collectionInfo[collection];
        allowed = info.poolIndexPlusOne != 0;
        floorPrice = info.floorPrice;
        poolLevel = info.poolLevel;
    }

    /// @notice Get floor price for a collection
    function getCollectionFloorPrice(address collection) external view returns (uint256) {
        return _collectionInfo[collection].floorPrice;
    }

    /// @notice Check if collection is allowed (i.e. assigned to some pool)
    function isCollectionAllowed(address collection) external view returns (bool) {
        return _collectionInfo[collection].poolIndexPlusOne != 0;
    }

    /// @notice Get pool level for a collection based on current assignment
    function getCollectionPoolLevel(address collection) external view returns (PoolLevel) {
        CollectionInfo storage info = _collectionInfo[collection];
        return info.poolLevel;
    }

    /// @notice Check if NFT is tracked in pool
    function isNftInPool(address collection, uint256 tokenId) external view returns (bool) {
        return _collectionTokenIndexPlusOne[collection][tokenId] != 0;
    }

    /// @notice Get NFT's current pool level
    function getNftPoolLevel(address collection, uint256 tokenId) external view returns (PoolLevel) {
        if (_collectionTokenIndexPlusOne[collection][tokenId] == 0) {
            revert NotInPool();
        }
        return _collectionInfo[collection].poolLevel;
    }

    // -----------------------
    // Overrides
    // -----------------------

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControlUpgradeable) returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // -----------------------
    // Storage Gap
    // -----------------------

    uint256[44] private __gap;
}
