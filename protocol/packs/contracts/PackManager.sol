// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {RariPack} from "./RariPack.sol";
import {NftPool} from "./NftPool.sol";

/// @title PackManager
/// @notice Opens RariPack NFTs and distributes rewards from NftPools using Chainlink VRF
/// @dev Uses Chainlink VRF v2.5 for verifiable randomness when selecting NFTs from pools
contract PackManager is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    // -----------------------
    // Types
    // -----------------------

    /// @dev Request state for pending VRF callbacks
    struct OpenRequest {
        address requester;
        uint256 packTokenId;
        RariPack.PackType packType;
        bool fulfilled;
    }

    /// @dev Reward NFT info for events
    struct RewardNft {
        address collection;
        uint256 tokenId;
        NftPool.PoolType poolType;
    }

    // -----------------------
    // Constants
    // -----------------------

    /// @dev Number of NFTs rewarded per pack opening
    uint256 public constant REWARDS_PER_PACK = 3;

    /// @dev Probability precision (10000 = 100.00%)
    uint256 private constant PROBABILITY_PRECISION = 10000;

    // Platinum probabilities (cumulative thresholds out of 10000)
    // UltraRare: 0.5% = 50, Legendary: 1.5% = 150, Epic: 2.5% = 250, Rare: 3.5% = 350, Common: rest
    uint256 private constant PLATINUM_ULTRARARE = 50; // 0 - 49
    uint256 private constant PLATINUM_LEGENDARY = 200; // 50 - 199 (50 + 150)
    uint256 private constant PLATINUM_EPIC = 450; // 200 - 449 (200 + 250)
    uint256 private constant PLATINUM_RARE = 800; // 450 - 799 (450 + 350)
    // Common: 800 - 9999

    // Gold probabilities (cumulative thresholds out of 10000) - no UltraRare
    // Legendary: 1% = 100, Epic: 1.5% = 150, Rare: 2.5% = 250, Common: rest
    uint256 private constant GOLD_LEGENDARY = 100; // 0 - 99
    uint256 private constant GOLD_EPIC = 250; // 100 - 249 (100 + 150)
    uint256 private constant GOLD_RARE = 500; // 250 - 499 (250 + 250)
    // Common: 500 - 9999

    // Silver probabilities (cumulative thresholds out of 10000) - no UltraRare
    // Legendary: 0.5% = 50, Epic: 1% = 100, Rare: 1.5% = 150, Common: rest
    uint256 private constant SILVER_LEGENDARY = 50; // 0 - 49
    uint256 private constant SILVER_EPIC = 150; // 50 - 149 (50 + 100)
    uint256 private constant SILVER_RARE = 300; // 150 - 299 (150 + 150)
    // Common: 300 - 9999

    // Bronze probabilities (cumulative thresholds out of 10000) - no UltraRare
    // Legendary: 0.25% = 25, Epic: 1% = 100, Rare: 1.5% = 150, Common: rest
    uint256 private constant BRONZE_LEGENDARY = 25; // 0 - 24
    uint256 private constant BRONZE_EPIC = 125; // 25 - 124 (25 + 100)
    uint256 private constant BRONZE_RARE = 275; // 125 - 274 (125 + 150)
    // Common: 275 - 9999

    // -----------------------
    // Storage
    // -----------------------

    /// @dev RariPack contract reference
    RariPack public rariPack;

    /// @dev Pool type => NftPool contract address
    mapping(NftPool.PoolType => NftPool) public pools;

    /// @dev VRF Coordinator address
    address public vrfCoordinator;

    /// @dev VRF subscription ID
    uint256 public vrfSubscriptionId;

    /// @dev VRF key hash (gas lane)
    bytes32 public vrfKeyHash;

    /// @dev VRF callback gas limit
    uint32 public vrfCallbackGasLimit;

    /// @dev VRF request confirmations
    uint16 public vrfRequestConfirmations;

    /// @dev VRF request ID => OpenRequest
    mapping(uint256 => OpenRequest) public openRequests;

    /// @dev User address => array of pending request IDs
    mapping(address => uint256[]) private _userPendingRequests;

    // -----------------------
    // Events
    // -----------------------

    event PackOpenRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        RariPack.PackType packType
    );

    event PackOpened(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        RewardNft[3] rewards
    );

    event PoolSet(NftPool.PoolType indexed poolType, address indexed poolAddress);
    event RariPackSet(address indexed rariPackAddress);
    event VrfConfigUpdated(
        address indexed coordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    );

    // -----------------------
    // Errors
    // -----------------------

    error ZeroAddress();
    error NotPackOwner();
    error PoolNotSet(NftPool.PoolType poolType);
    error PoolEmpty(NftPool.PoolType poolType);
    error InvalidVrfCoordinator();
    error RequestNotFound();
    error RequestAlreadyFulfilled();
    error OnlyVrfCoordinator();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // -----------------------
    // Initializer
    // -----------------------

    /// @notice Initialize the PackManager
    /// @param initialOwner Owner address
    /// @param rariPack_ RariPack contract address
    function initialize(address initialOwner, address rariPack_) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (rariPack_ == address(0)) revert ZeroAddress();

        __Ownable_init(initialOwner);
        __ReentrancyGuard_init();
        __Pausable_init();

        rariPack = RariPack(rariPack_);
        emit RariPackSet(rariPack_);
    }

    // -----------------------
    // Admin: Configuration
    // -----------------------

    /// @notice Set the RariPack contract
    function setRariPack(address rariPack_) external onlyOwner {
        if (rariPack_ == address(0)) revert ZeroAddress();
        rariPack = RariPack(rariPack_);
        emit RariPackSet(rariPack_);
    }

    /// @notice Set a pool for a specific pool type
    function setPool(NftPool.PoolType poolType, address pool_) external onlyOwner {
        if (pool_ == address(0)) revert ZeroAddress();
        pools[poolType] = NftPool(pool_);
        emit PoolSet(poolType, pool_);
    }

    /// @notice Configure Chainlink VRF parameters
    function setVrfConfig(
        address coordinator_,
        uint256 subscriptionId_,
        bytes32 keyHash_,
        uint32 callbackGasLimit_,
        uint16 requestConfirmations_
    ) external onlyOwner {
        if (coordinator_ == address(0)) revert ZeroAddress();
        vrfCoordinator = coordinator_;
        vrfSubscriptionId = subscriptionId_;
        vrfKeyHash = keyHash_;
        vrfCallbackGasLimit = callbackGasLimit_;
        vrfRequestConfirmations = requestConfirmations_;
        emit VrfConfigUpdated(coordinator_, subscriptionId_, keyHash_, callbackGasLimit_, requestConfirmations_);
    }

    /// @notice Pause pack opening
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause pack opening
    function unpause() external onlyOwner {
        _unpause();
    }

    // -----------------------
    // Core: Open Pack
    // -----------------------

    /// @notice Request to open a pack. Burns the pack and requests VRF randomness.
    /// @param packTokenId The token ID of the pack to open
    /// @return requestId The VRF request ID
    function openPack(uint256 packTokenId) external nonReentrant whenNotPaused returns (uint256 requestId) {
        // Verify caller owns the pack
        if (rariPack.ownerOf(packTokenId) != msg.sender) revert NotPackOwner();

        // Get pack type before burning
        RariPack.PackType packType = rariPack.packTypeOf(packTokenId);

        // Verify all required pools have NFTs available
        _verifyPoolsAvailable(packType);

        // Burn the pack
        rariPack.burnPack(packTokenId);

        // Request randomness from VRF
        requestId = _requestRandomness();

        // Store request
        openRequests[requestId] = OpenRequest({
            requester: msg.sender,
            packTokenId: packTokenId,
            packType: packType,
            fulfilled: false
        });

        _userPendingRequests[msg.sender].push(requestId);

        emit PackOpenRequested(requestId, msg.sender, packTokenId, packType);
    }

    /// @notice Callback function for VRF Coordinator
    /// @dev Only callable by the VRF Coordinator
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != vrfCoordinator) revert OnlyVrfCoordinator();
        _fulfillRandomWords(requestId, randomWords);
    }

    // -----------------------
    // Internal: VRF
    // -----------------------

    /// @dev Request random words from VRF Coordinator
    function _requestRandomness() internal returns (uint256 requestId) {
        if (vrfCoordinator == address(0)) revert InvalidVrfCoordinator();

        // Call VRF Coordinator to request randomness
        // VRF v2.5 uses requestRandomWords with the following signature
        bytes memory data = abi.encodeWithSignature(
            "requestRandomWords(bytes32,uint256,uint16,uint32,uint32)",
            vrfKeyHash,
            vrfSubscriptionId,
            vrfRequestConfirmations,
            vrfCallbackGasLimit,
            uint32(REWARDS_PER_PACK) // numWords - one random word per reward
        );

        (bool success, bytes memory returnData) = vrfCoordinator.call(data);
        require(success, "PackManager: VRF request failed");
        requestId = abi.decode(returnData, (uint256));
    }

    /// @dev Process VRF callback and distribute rewards
    function _fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal {
        OpenRequest storage request = openRequests[requestId];
        if (request.requester == address(0)) revert RequestNotFound();
        if (request.fulfilled) revert RequestAlreadyFulfilled();

        request.fulfilled = true;

        RewardNft[3] memory rewards;

        // Select 3 NFTs based on pack type and random words
        for (uint256 i = 0; i < REWARDS_PER_PACK; i++) {
            uint256 randomValue = randomWords[i];

            // Determine pool type based on probability
            NftPool.PoolType poolType = _selectPoolType(request.packType, randomValue);

            // Get pool and select random NFT
            NftPool pool = pools[poolType];

            // Select random NFT from pool
            uint256 poolSize = pool.poolSize();
            uint256 nftIndex = randomValue % poolSize;

            (address collection, uint256 tokenId) = pool.poolNftAt(nftIndex);

            // Transfer NFT to requester
            pool.transferNft(collection, request.requester, tokenId);

            rewards[i] = RewardNft({collection: collection, tokenId: tokenId, poolType: poolType});
        }

        // Remove from pending requests
        _removePendingRequest(request.requester, requestId);

        emit PackOpened(requestId, request.requester, request.packTokenId, rewards);
    }

    // -----------------------
    // Internal: Pool Selection
    // -----------------------

    /// @dev Select pool type based on pack type and random value
    function _selectPoolType(
        RariPack.PackType packType,
        uint256 randomValue
    ) internal pure returns (NftPool.PoolType) {
        uint256 roll = randomValue % PROBABILITY_PRECISION;

        if (packType == RariPack.PackType.Platinum) {
            if (roll < PLATINUM_ULTRARARE) return NftPool.PoolType.UltraRare;
            if (roll < PLATINUM_LEGENDARY) return NftPool.PoolType.Legendary;
            if (roll < PLATINUM_EPIC) return NftPool.PoolType.Epic;
            if (roll < PLATINUM_RARE) return NftPool.PoolType.Rare;
            return NftPool.PoolType.Common;
        } else if (packType == RariPack.PackType.Gold) {
            if (roll < GOLD_LEGENDARY) return NftPool.PoolType.Legendary;
            if (roll < GOLD_EPIC) return NftPool.PoolType.Epic;
            if (roll < GOLD_RARE) return NftPool.PoolType.Rare;
            return NftPool.PoolType.Common;
        } else if (packType == RariPack.PackType.Silver) {
            if (roll < SILVER_LEGENDARY) return NftPool.PoolType.Legendary;
            if (roll < SILVER_EPIC) return NftPool.PoolType.Epic;
            if (roll < SILVER_RARE) return NftPool.PoolType.Rare;
            return NftPool.PoolType.Common;
        } else {
            // Bronze
            if (roll < BRONZE_LEGENDARY) return NftPool.PoolType.Legendary;
            if (roll < BRONZE_EPIC) return NftPool.PoolType.Epic;
            if (roll < BRONZE_RARE) return NftPool.PoolType.Rare;
            return NftPool.PoolType.Common;
        }
    }

    /// @dev Verify that all possible pools for a pack type have NFTs available
    function _verifyPoolsAvailable(RariPack.PackType packType) internal view {
        // All pack types need at least Common pool
        _verifyPoolHasNfts(NftPool.PoolType.Common);
        _verifyPoolHasNfts(NftPool.PoolType.Rare);
        _verifyPoolHasNfts(NftPool.PoolType.Epic);
        _verifyPoolHasNfts(NftPool.PoolType.Legendary);

        // Only Platinum packs can get UltraRare
        if (packType == RariPack.PackType.Platinum) {
            _verifyPoolHasNfts(NftPool.PoolType.UltraRare);
        }
    }

    /// @dev Verify a specific pool is set and has NFTs
    function _verifyPoolHasNfts(NftPool.PoolType poolType) internal view {
        NftPool pool = pools[poolType];
        if (address(pool) == address(0)) revert PoolNotSet(poolType);
        if (pool.poolSize() == 0) revert PoolEmpty(poolType);
    }

    /// @dev Remove a request from user's pending requests array
    function _removePendingRequest(address user, uint256 requestId) internal {
        uint256[] storage pending = _userPendingRequests[user];
        for (uint256 i = 0; i < pending.length; i++) {
            if (pending[i] == requestId) {
                pending[i] = pending[pending.length - 1];
                pending.pop();
                break;
            }
        }
    }

    // -----------------------
    // Views
    // -----------------------

    /// @notice Get all pending request IDs for a user
    function getPendingRequests(address user) external view returns (uint256[] memory) {
        return _userPendingRequests[user];
    }

    /// @notice Check if all required pools are configured and have NFTs for a pack type
    function canOpenPack(RariPack.PackType packType) external view returns (bool) {
        // Check Common, Rare, Epic, Legendary pools
        if (address(pools[NftPool.PoolType.Common]) == address(0)) return false;
        if (pools[NftPool.PoolType.Common].poolSize() == 0) return false;

        if (address(pools[NftPool.PoolType.Rare]) == address(0)) return false;
        if (pools[NftPool.PoolType.Rare].poolSize() == 0) return false;

        if (address(pools[NftPool.PoolType.Epic]) == address(0)) return false;
        if (pools[NftPool.PoolType.Epic].poolSize() == 0) return false;

        if (address(pools[NftPool.PoolType.Legendary]) == address(0)) return false;
        if (pools[NftPool.PoolType.Legendary].poolSize() == 0) return false;

        // Platinum also needs UltraRare
        if (packType == RariPack.PackType.Platinum) {
            if (address(pools[NftPool.PoolType.UltraRare]) == address(0)) return false;
            if (pools[NftPool.PoolType.UltraRare].poolSize() == 0) return false;
        }

        return true;
    }

    /// @notice Get pool address for a pool type
    function getPool(NftPool.PoolType poolType) external view returns (address) {
        return address(pools[poolType]);
    }

    // -----------------------
    // Storage Gap
    // -----------------------

    uint256[40] private __gap;
}
