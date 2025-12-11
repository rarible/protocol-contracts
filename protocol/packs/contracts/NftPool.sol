// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721HolderUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NftPool is Initializable, ERC721HolderUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
    // -----------------------
    // Types
    // -----------------------

    /// @dev Pool types ordered from common to rare, so new rarer tiers can be added at the end
    enum PoolType {
        Common,
        Rare,
        Epic,
        Legendary,
        UltraRare
    }

    struct NftInfo {
        address collection;
        uint256 tokenId;
    }

    // -----------------------
    // Storage
    // -----------------------

    /// @dev The rarity/type of this pool instance
    PoolType public poolType;

    /// @dev Allowed ERC721 collections
    mapping(address => bool) private allowed721Contracts;

    /// @dev NFTs stored in this pool
    NftInfo[] private _poolNfts;

    /// @dev Collection + tokenId -> index+1 in _poolNfts array (0 means not in pool)
    mapping(address => mapping(uint256 => uint256)) private _nftIndexPlusOne;

    // -----------------------
    // Roles
    // -----------------------

    /// @dev Addresses allowed to transfer NFTs out of the pool (e.g. pack-opening contract)
    bytes32 public constant POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE");

    // -----------------------
    // Events / Errors
    // -----------------------

    event Deposited(address indexed collection, uint256 indexed tokenId, PoolType indexed poolType);
    event Withdrawn(address indexed to, address indexed collection, uint256 indexed tokenId, PoolType poolType);
    event Allowed721ContractAdded(address indexed collection);
    event Allowed721ContractRemoved(address indexed collection);
    event RescuedNft(address indexed to, address indexed collection, uint256 indexed tokenId);

    error CollectionNotAllowed();
    error NotInPool();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // -----------------------
    // Init
    // -----------------------

    function initialize(address initialOwner, PoolType poolType_) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();

        __ERC721Holder_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();

        poolType = poolType_;

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(POOL_MANAGER_ROLE, initialOwner);
    }

    // -----------------------
    // Admin: allowed collections
    // -----------------------

    function addAllowed721Contract(address collection) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        allowed721Contracts[collection] = true;
        emit Allowed721ContractAdded(collection);
    }

    function removeAllowed721Contract(address collection) external onlyOwner {
        allowed721Contracts[collection] = false;
        emit Allowed721ContractRemoved(collection);
    }

    function isAllowed721Contract(address collection) external view returns (bool) {
        return allowed721Contracts[collection];
    }

    // -----------------------
    // Pool operations
    // -----------------------

    /// @notice Deposit an NFT into this pool's type.
    /// @dev Caller must own the NFT and have approved this contract.
    function deposit(address collection, uint256 tokenId) external {
        if (!allowed721Contracts[collection]) revert CollectionNotAllowed();

        // Pull NFT into the pool - onERC721Received will handle bookkeeping
        IERC721(collection).safeTransferFrom(msg.sender, address(this), tokenId);
    }

    /// @notice Transfer an NFT out of the pool to `to`.
    /// @dev Can only be called by POOL_MANAGER_ROLE (e.g. pack-opening / reward contract).
    function transferNft(address collection, address to, uint256 tokenId) external onlyRole(POOL_MANAGER_ROLE) {
        if (_nftIndexPlusOne[collection][tokenId] == 0) revert NotInPool();

        _removeFromPool(collection, tokenId);

        IERC721(collection).safeTransferFrom(address(this), to, tokenId);

        emit Withdrawn(to, collection, tokenId, poolType);
    }

    /// @notice Rescue an NFT that was sent from a non-allowed collection
    /// @dev Only owner can rescue, and only NFTs NOT tracked in the pool
    function rescueNft(address collection, address to, uint256 tokenId) external onlyOwner {
        // Can only rescue NFTs that are NOT in the pool tracking
        require(_nftIndexPlusOne[collection][tokenId] == 0, "NftPool: NFT is tracked in pool");
        require(IERC721(collection).ownerOf(tokenId) == address(this), "NftPool: not owned by pool");

        IERC721(collection).safeTransferFrom(address(this), to, tokenId);

        emit RescuedNft(to, collection, tokenId);
    }

    // -----------------------
    // ERC721 Receiver Override
    // -----------------------

    /// @notice Handle incoming NFT transfers
    /// @dev Only accepts NFTs from allowed collections and tracks them
    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 tokenId,
        bytes memory /* data */
    ) public virtual override returns (bytes4) {
        address collection = msg.sender;

        // Only accept and track NFTs from allowed collections
        if (allowed721Contracts[collection]) {
            // Avoid double-adding if somehow already tracked
            if (_nftIndexPlusOne[collection][tokenId] == 0) {
                _addToPool(collection, tokenId);
            }
        }
        // Note: We still return the selector even for non-allowed collections
        // to prevent the transfer from reverting. Owner can rescue these later.

        return this.onERC721Received.selector;
    }

    // -----------------------
    // Internal pool bookkeeping
    // -----------------------

    function _addToPool(address collection, uint256 tokenId) internal {
        _poolNfts.push(NftInfo({collection: collection, tokenId: tokenId}));

        uint256 index = _poolNfts.length; // 1-based index
        _nftIndexPlusOne[collection][tokenId] = index;

        emit Deposited(collection, tokenId, poolType);
    }

    function _removeFromPool(address collection, uint256 tokenId) internal {
        uint256 indexPlusOne = _nftIndexPlusOne[collection][tokenId];
        if (indexPlusOne == 0) revert NotInPool();

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _poolNfts.length - 1;

        if (index != lastIndex) {
            NftInfo memory last = _poolNfts[lastIndex];
            _poolNfts[index] = last;
            _nftIndexPlusOne[last.collection][last.tokenId] = index + 1;
        }

        _poolNfts.pop();
        delete _nftIndexPlusOne[collection][tokenId];
    }

    // -----------------------
    // Views
    // -----------------------

    function poolSize() external view returns (uint256) {
        return _poolNfts.length;
    }

    function poolNftAt(uint256 index) external view returns (address collection, uint256 tokenId) {
        NftInfo memory info = _poolNfts[index];
        return (info.collection, info.tokenId);
    }

    function nftPoolOf(address collection, uint256 tokenId) external view returns (PoolType) {
        require(_nftIndexPlusOne[collection][tokenId] != 0, "NftPool: not in pool");
        return poolType;
    }

    function isNftInPool(address collection, uint256 tokenId) external view returns (bool) {
        return _nftIndexPlusOne[collection][tokenId] != 0;
    }

    // -----------------------
    // Overrides
    // -----------------------

    function supportsInterface(bytes4 interfaceId) public view override(AccessControlUpgradeable) returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || super.supportsInterface(interfaceId);
    }

    uint256[45] private __gap;
}
