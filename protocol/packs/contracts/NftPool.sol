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
/// NFTs are tracked per collection; pools maintain aggregate counts (no per-NFT migration on floor change).
contract NftPool is Initializable, ERC721HolderUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
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
    /// @dev Number of defined pool levels (update if enum is extended)
    uint256 private constant _POOL_LEVEL_COUNT = uint256(PoolLevel.UltraRare) + 1;
    /// @dev Pool price range configuration + collections + aggregate NFT count
    struct PoolInfo {
        uint256 lowPrice; // Minimum floor price (inclusive)
        uint256 highPrice; // Maximum floor price (exclusive)
        address[] collections; // Collections currently assigned to this pool
        uint256 totalNfts; // Total NFTs (across all collections) in this pool
    }
    /// @dev Lightweight config struct for pool ranges (no collections/total)
    struct PoolRange {
        uint256 lowPrice;
        uint256 highPrice;
    }
    /// @dev Per-collection configuration and pool membership
    /// @notice "Allowed" is derived from poolIndexPlusOne != 0
    struct CollectionInfo {
        uint256 floorPrice; // Current floor price in wei
        PoolLevel poolLevel; // Logical pool level for this collection
        uint256 poolIndexPlusOne; // 1-based index in PoolInfo.collections, 0 = not assigned / not allowed
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
    error AlreadyTracked();
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    // -----------------------
    // Init
    // -----------------------
    /// @notice Initialize pool with owner and optional custom pool ranges
    /// @param initialOwner Owner / admin address
    /// @param ranges Optional array of pool ranges, length must equal number of pool levels.
    /// If empty, default ETH ranges are used.
    function initialize(address initialOwner, PoolRange[] calldata ranges) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        __ERC721Holder_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(POOL_MANAGER_ROLE, initialOwner);
        if (ranges.length == 0) {
            // Default price ranges (in wei), scaled for 10% average profit
            // Common: 0 - 0.05325 ETH
            // Rare: 0.05325 - 0.213 ETH
            // Epic: 0.213 - 1.065 ETH
            // Legendary: 1.065 - 5.325 ETH
            // UltraRare: 5.325+ ETH (no practical upper bound)
            _poolInfo[PoolLevel.Common].lowPrice = 0;
            _poolInfo[PoolLevel.Common].highPrice = 0.05325 ether;
            _poolInfo[PoolLevel.Rare].lowPrice = 0.05325 ether;
            _poolInfo[PoolLevel.Rare].highPrice = 0.213 ether;
            _poolInfo[PoolLevel.Epic].lowPrice = 0.213 ether;
            _poolInfo[PoolLevel.Epic].highPrice = 1.065 ether;
            _poolInfo[PoolLevel.Legendary].lowPrice = 1.065 ether;
            _poolInfo[PoolLevel.Legendary].highPrice = 5.325 ether;
            _poolInfo[PoolLevel.UltraRare].lowPrice = 5.325 ether;
            _poolInfo[PoolLevel.UltraRare].highPrice = type(uint256).max;
        } else {
            if (ranges.length != _POOL_LEVEL_COUNT) revert ArrayLengthMismatch();
            for (uint256 i = 0; i < ranges.length; i++) {
                PoolRange calldata cfg = ranges[i];
                if (cfg.lowPrice >= cfg.highPrice) revert InvalidPriceRange();
                PoolLevel level = PoolLevel(i);
                PoolInfo storage p = _poolInfo[level];
                p.lowPrice = cfg.lowPrice;
                p.highPrice = cfg.highPrice;
                emit PoolInfoUpdated(level, cfg.lowPrice, cfg.highPrice);
            }
        }
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
    /// @notice Batch set all pool price ranges via array
    /// @dev ranges.length must equal number of pool levels
    function setAllPoolInfo(PoolRange[] calldata ranges) external onlyOwner {
        if (ranges.length != _POOL_LEVEL_COUNT) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < ranges.length; i++) {
            PoolRange calldata cfg = ranges[i];
            if (cfg.lowPrice >= cfg.highPrice) revert InvalidPriceRange();
            PoolLevel level = PoolLevel(i);
            PoolInfo storage info = _poolInfo[level];
            info.lowPrice = cfg.lowPrice;
            info.highPrice = cfg.highPrice;
            emit PoolInfoUpdated(level, cfg.lowPrice, cfg.highPrice);
        }
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
    function _setCollectionConfig(address collection, bool allowed, uint256 newFloorPrice) internal {
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
    ) external onlyRole(POOL_MANAGER_ROLE) {
        if (collection == address(0)) revert ZeroAddress();
        _setCollectionConfig(collection, allowed, floorPrice);
    }
    /// @notice Batch configure multiple collections
    function configureCollections(
        address[] calldata collections,
        bool[] calldata allowedList,
        uint256[] calldata floorPrices
    ) external onlyRole(POOL_MANAGER_ROLE) {
        if (collections.length != allowedList.length || collections.length != floorPrices.length) {
            revert ArrayLengthMismatch();
        }
        for (uint256 i = 0; i < collections.length; i++) {
            if (collections[i] == address(0)) revert ZeroAddress();
            _setCollectionConfig(collections[i], allowedList[i], floorPrices[i]);
        }
    }
    /// @notice Update floor price for a collection and mark it as allowed
    /// @dev Pool level and aggregate NFT counts are adjusted without per-NFT migration.
    /// Calling this will always mark the collection as allowed.
    function setCollectionFloorPrice(address collection, uint256 newPrice) external onlyRole(POOL_MANAGER_ROLE) {
        if (collection == address(0)) revert ZeroAddress();
        _setCollectionConfig(collection, true, newPrice);
    }
    /// @notice Batch update floor prices and mark all collections as allowed
    function setCollectionFloorPrices(
        address[] calldata collections,
        uint256[] calldata floorPrices
    ) external onlyRole(POOL_MANAGER_ROLE) {
        if (collections.length != floorPrices.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < collections.length; i++) {
            if (collections[i] == address(0)) revert ZeroAddress();
            _setCollectionConfig(collections[i], true, floorPrices[i]);
        }
    }
    // -----------------------
    // Internal: NFT Bookkeeping
    // -----------------------
    function _addCollectionToken(address collection, uint256 tokenId, PoolLevel level) internal {
        // protect from duplicates
        if (_collectionTokenIndexPlusOne[collection][tokenId] != 0) revert AlreadyTracked();
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
    /// @dev Uses safeTransferFrom; we also add to internal bookkeeping here
    /// in case some collections don't properly call onERC721Received.
    function deposit(address collection, uint256 tokenId) external {
        CollectionInfo storage info = _collectionInfo[collection];
        if (info.poolIndexPlusOne == 0) revert CollectionNotAllowed();
        if (info.floorPrice == 0) revert FloorPriceNotSet();
        IERC721(collection).safeTransferFrom(msg.sender, address(this), tokenId);
        // If for some reason onERC721Received was not called or didn't track,
        // ensure the NFT is accounted here.
        if (_collectionTokenIndexPlusOne[collection][tokenId] == 0) {
            _addCollectionToken(collection, tokenId, info.poolLevel);
        }
    }
    /// @notice Transfer an NFT out of the pool
    function transferNft(address collection, address to, uint256 tokenId) external onlyRole(POOL_MANAGER_ROLE) {
        CollectionInfo storage info = _collectionInfo[collection];
        PoolLevel level = info.poolLevel;
        _removeCollectionToken(collection, tokenId, level);
        IERC721(collection).safeTransferFrom(address(this), to, tokenId);
        emit Withdrawn(to, collection, tokenId, level);
    }
    /// @notice Rescue an NFT that was sent incorrectly and is not tracked
    function rescueNft(address collection, address to, uint256 tokenId) external onlyOwner {
        require(_collectionTokenIndexPlusOne[collection][tokenId] == 0, "NftPool: NFT is tracked");
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
    /// @notice Iterates over all levels; if overlapping ranges exist,
    /// the highest index level that matches wins.
    function _getPoolLevelForPrice(uint256 price) internal view returns (PoolLevel) {
        // walk from highest index to lowest
        for (uint256 i = _POOL_LEVEL_COUNT; i > 0; i--) {
            PoolLevel level = PoolLevel(i - 1);
            PoolInfo storage p = _poolInfo[level];
            if (price >= p.lowPrice && price < p.highPrice) {
                return level;
            }
        }
        // Fallback if misconfigured: Common
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
        if (index >= _poolInfo[level].totalNfts) revert IndexOutOfBounds();
        return _selectNftAtIndex(level, index);
    }
    /// @notice Select and transfer a random NFT from a pool level
    /// @dev Uses pool.totalNfts and walks collections; no per-NFT migration on floor price changes.
    function selectAndTransferFromLevel(
        PoolLevel level,
        uint256 randomValue,
        address to
    ) external onlyRole(POOL_MANAGER_ROLE) returns (address collection, uint256 tokenId) {
        uint256 total = _poolInfo[level].totalNfts;
        if (total == 0) revert LevelEmpty(level);
        (collection, tokenId) = _selectNftAtIndex(level, randomValue % total);
        _removeCollectionToken(collection, tokenId, level);
        IERC721(collection).safeTransferFrom(address(this), to, tokenId);
        emit Withdrawn(to, collection, tokenId, level);
    }
    /// @notice Select and lock a random NFT from a pool level without transferring it out.
    /// @dev Used by PackManager so NFTs stay owned by NftPool and are just removed from accounting.
    function selectAndLockFromLevel(
        PoolLevel level,
        uint256 randomValue
    ) external onlyRole(POOL_MANAGER_ROLE) returns (address collection, uint256 tokenId) {
        uint256 total = _poolInfo[level].totalNfts;
        if (total == 0) revert LevelEmpty(level);
        (collection, tokenId) = _selectNftAtIndex(level, randomValue % total);
        // Remove from accounting so it cannot be selected again while locked in a pack
        _removeCollectionToken(collection, tokenId, level);
    }
    /// @dev Find NFT at global index within a pool level
    function _selectNftAtIndex(
        PoolLevel level,
        uint256 globalIndex
    ) internal view returns (address collection, uint256 tokenId) {
        address[] storage collections = _poolInfo[level].collections;
        uint256 remaining = globalIndex;
        for (uint256 i = 0; i < collections.length; i++) {
            address coll = collections[i];
            uint256 count = _collectionTokens[coll].length;
            if (count > 0 && remaining < count) {
                return (coll, _collectionTokens[coll][remaining]);
            }
            remaining -= count;
        }
        revert LevelEmpty(level);
    }
    // -----------------------
    // Locking helpers (for PackManager)
    // -----------------------
    /// @notice Re-add a previously locked NFT back into the pool accounting.
    /// @dev NFT must still be owned by the pool and not currently tracked.
    function addLockedNft(address collection, uint256 tokenId) external onlyRole(POOL_MANAGER_ROLE) {
        CollectionInfo storage info = _collectionInfo[collection];
        if (info.poolIndexPlusOne == 0) revert CollectionNotAllowed();
        if (IERC721(collection).ownerOf(tokenId) != address(this)) revert NotInPool();
        if (_collectionTokenIndexPlusOne[collection][tokenId] != 0) revert AlreadyTracked();
        _addCollectionToken(collection, tokenId, info.poolLevel);
    }
    /// @notice Transfer a locked NFT (no longer tracked in accounting) to a recipient.
    /// @dev Used by PackManager in the NFT-claim path. Does not change pool totals because
    /// the NFT was removed from accounting when it was locked.
    function transferLockedNft(address collection, address to, uint256 tokenId) external onlyRole(POOL_MANAGER_ROLE) {
        if (_collectionTokenIndexPlusOne[collection][tokenId] != 0) revert AlreadyTracked();
        if (IERC721(collection).ownerOf(tokenId) != address(this)) revert NotInPool();
        PoolLevel level = _collectionInfo[collection].poolLevel;
        IERC721(collection).safeTransferFrom(address(this), to, tokenId);
        emit Withdrawn(to, collection, tokenId, level);
    }
    // -----------------------
    // Views
    // -----------------------
    /// @notice Get total NFTs across all pools
    function totalPoolSize() external view returns (uint256 total) {
        for (uint256 i = 0; i < _POOL_LEVEL_COUNT; i++) {
            total += _poolInfo[PoolLevel(i)].totalNfts;
        }
    }
    /// @notice Get pool price range configuration
    function getPoolInfo(PoolLevel level) external view returns (uint256 lowPrice, uint256 highPrice) {
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
    function supportsInterface(bytes4 interfaceId) public view override(AccessControlUpgradeable) returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
    // -----------------------
    // Storage Gap
    // -----------------------
    uint256[44] private __gap;
}
