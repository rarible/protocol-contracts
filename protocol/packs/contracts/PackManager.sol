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

    /// @dev Probability thresholds for each pack type (cumulative, out of 10000)
    /// @param ultraRare Threshold for UltraRare (only used for Platinum)
    /// @param legendary Threshold for Legendary (cumulative)
    /// @param epic Threshold for Epic (cumulative)
    /// @param rare Threshold for Rare (cumulative)
    /// @dev Values above rare threshold result in Common
    struct PackProbabilities {
        uint16 ultraRare;
        uint16 legendary;
        uint16 epic;
        uint16 rare;
    }

    // -----------------------
    // Constants
    // -----------------------

    /// @dev Number of NFTs rewarded per pack opening
    uint256 public constant REWARDS_PER_PACK = 3;

    /// @dev Probability precision (10000 = 100.00%)
    uint256 public constant PROBABILITY_PRECISION = 10000;

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

    /// @dev Pack type => probability thresholds
    mapping(RariPack.PackType => PackProbabilities) private _packProbabilities;

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
    event PackProbabilitiesUpdated(
        RariPack.PackType indexed packType,
        uint16 ultraRare,
        uint16 legendary,
        uint16 epic,
        uint16 rare
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
    error InvalidProbabilities();

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

        // Set default probabilities
        _setDefaultProbabilities();
    }

    /// @dev Set default probability thresholds
    /// Drop rates: UltraRare 0.1%, Legendary 0.4%, Epic 1.5%, Rare 7%, Common 91%
    function _setDefaultProbabilities() internal {
        // Platinum: UltraRare 0.1%, Legendary 0.4%, Epic 1.5%, Rare 7%, Common 91%
        _packProbabilities[RariPack.PackType.Platinum] = PackProbabilities({
            ultraRare: 10, // 0.1%
            legendary: 50, // 0.1% + 0.4% = 0.5% cumulative
            epic: 200, // 0.5% + 1.5% = 2% cumulative
            rare: 900 // 2% + 7% = 9% cumulative, Common = 91%
        });

        // Gold: Legendary 0.4%, Epic 1.5%, Rare 7%, Common 91.1%
        _packProbabilities[RariPack.PackType.Gold] = PackProbabilities({
            ultraRare: 0, // Not available
            legendary: 40, // 0.4%
            epic: 190, // 0.4% + 1.5% = 1.9% cumulative
            rare: 890 // 1.9% + 7% = 8.9% cumulative, Common = 91.1%
        });

        // Silver: Legendary 0.4%, Epic 1.5%, Rare 7%, Common 91.1%
        _packProbabilities[RariPack.PackType.Silver] = PackProbabilities({
            ultraRare: 0, // Not available
            legendary: 40, // 0.4%
            epic: 190, // 0.4% + 1.5% = 1.9% cumulative
            rare: 890 // 1.9% + 7% = 8.9% cumulative, Common = 91.1%
        });

        // Bronze: Legendary 0.4%, Epic 1.5%, Rare 7%, Common 91.1%
        _packProbabilities[RariPack.PackType.Bronze] = PackProbabilities({
            ultraRare: 0, // Not available
            legendary: 40, // 0.4%
            epic: 190, // 0.4% + 1.5% = 1.9% cumulative
            rare: 890 // 1.9% + 7% = 8.9% cumulative, Common = 91.1%
        });
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

    /// @notice Set probability thresholds for a pack type
    /// @param packType The pack type to configure
    /// @param ultraRare Cumulative threshold for UltraRare (only meaningful for Platinum)
    /// @param legendary Cumulative threshold for Legendary
    /// @param epic Cumulative threshold for Epic
    /// @param rare Cumulative threshold for Rare
    /// @dev All values are out of 10000 (100.00%). Must be in ascending order.
    /// @dev Example: ultraRare=50, legendary=200, epic=450, rare=800 means:
    ///      UltraRare: 0-49 (0.5%), Legendary: 50-199 (1.5%), Epic: 200-449 (2.5%), 
    ///      Rare: 450-799 (3.5%), Common: 800-9999 (92%)
    function setPackProbabilities(
        RariPack.PackType packType,
        uint16 ultraRare,
        uint16 legendary,
        uint16 epic,
        uint16 rare
    ) external onlyOwner {
        // Validate thresholds are in ascending order and within bounds
        if (ultraRare > legendary || legendary > epic || epic > rare || rare > PROBABILITY_PRECISION) {
            revert InvalidProbabilities();
        }

        _packProbabilities[packType] = PackProbabilities({
            ultraRare: ultraRare,
            legendary: legendary,
            epic: epic,
            rare: rare
        });

        emit PackProbabilitiesUpdated(packType, ultraRare, legendary, epic, rare);
    }

    /// @notice Batch set probabilities for all pack types
    /// @param platinumProbs Probabilities for Platinum packs
    /// @param goldProbs Probabilities for Gold packs
    /// @param silverProbs Probabilities for Silver packs
    /// @param bronzeProbs Probabilities for Bronze packs
    function setAllPackProbabilities(
        PackProbabilities calldata platinumProbs,
        PackProbabilities calldata goldProbs,
        PackProbabilities calldata silverProbs,
        PackProbabilities calldata bronzeProbs
    ) external onlyOwner {
        _validateAndSetProbabilities(RariPack.PackType.Platinum, platinumProbs);
        _validateAndSetProbabilities(RariPack.PackType.Gold, goldProbs);
        _validateAndSetProbabilities(RariPack.PackType.Silver, silverProbs);
        _validateAndSetProbabilities(RariPack.PackType.Bronze, bronzeProbs);
    }

    /// @dev Validate and set probabilities for a single pack type
    function _validateAndSetProbabilities(RariPack.PackType packType, PackProbabilities calldata probs) internal {
        if (
            probs.ultraRare > probs.legendary ||
            probs.legendary > probs.epic ||
            probs.epic > probs.rare ||
            probs.rare > PROBABILITY_PRECISION
        ) {
            revert InvalidProbabilities();
        }

        _packProbabilities[packType] = probs;

        emit PackProbabilitiesUpdated(packType, probs.ultraRare, probs.legendary, probs.epic, probs.rare);
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
    ) internal view returns (NftPool.PoolType) {
        uint256 roll = randomValue % PROBABILITY_PRECISION;
        PackProbabilities storage probs = _packProbabilities[packType];

        // For Platinum, check UltraRare first
        if (packType == RariPack.PackType.Platinum && roll < probs.ultraRare) {
            return NftPool.PoolType.UltraRare;
        }

        if (roll < probs.legendary) return NftPool.PoolType.Legendary;
        if (roll < probs.epic) return NftPool.PoolType.Epic;
        if (roll < probs.rare) return NftPool.PoolType.Rare;
        return NftPool.PoolType.Common;
    }

    /// @dev Verify that all possible pools for a pack type have NFTs available
    function _verifyPoolsAvailable(RariPack.PackType packType) internal view {
        // All pack types need at least Common pool
        _verifyPoolHasNfts(NftPool.PoolType.Common);
        _verifyPoolHasNfts(NftPool.PoolType.Rare);
        _verifyPoolHasNfts(NftPool.PoolType.Epic);
        _verifyPoolHasNfts(NftPool.PoolType.Legendary);

        // Only Platinum packs can get UltraRare (if probability > 0)
        PackProbabilities storage probs = _packProbabilities[packType];
        if (packType == RariPack.PackType.Platinum && probs.ultraRare > 0) {
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

    /// @notice Get probability thresholds for a pack type
    /// @param packType The pack type to query
    /// @return ultraRare Cumulative threshold for UltraRare
    /// @return legendary Cumulative threshold for Legendary
    /// @return epic Cumulative threshold for Epic
    /// @return rare Cumulative threshold for Rare
    function getPackProbabilities(
        RariPack.PackType packType
    ) external view returns (uint16 ultraRare, uint16 legendary, uint16 epic, uint16 rare) {
        PackProbabilities storage probs = _packProbabilities[packType];
        return (probs.ultraRare, probs.legendary, probs.epic, probs.rare);
    }

    /// @notice Get individual pool probabilities as percentages (in basis points, 100 = 1%)
    /// @param packType The pack type to query
    /// @return ultraRarePercent UltraRare probability (basis points)
    /// @return legendaryPercent Legendary probability (basis points)
    /// @return epicPercent Epic probability (basis points)
    /// @return rarePercent Rare probability (basis points)
    /// @return commonPercent Common probability (basis points)
    function getPackProbabilitiesPercent(
        RariPack.PackType packType
    )
        external
        view
        returns (
            uint16 ultraRarePercent,
            uint16 legendaryPercent,
            uint16 epicPercent,
            uint16 rarePercent,
            uint16 commonPercent
        )
    {
        PackProbabilities storage probs = _packProbabilities[packType];

        ultraRarePercent = probs.ultraRare;
        legendaryPercent = probs.legendary - probs.ultraRare;
        epicPercent = probs.epic - probs.legendary;
        rarePercent = probs.rare - probs.epic;
        commonPercent = uint16(PROBABILITY_PRECISION) - probs.rare;
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

        // Platinum also needs UltraRare if probability > 0
        PackProbabilities storage probs = _packProbabilities[packType];
        if (packType == RariPack.PackType.Platinum && probs.ultraRare > 0) {
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

    uint256[39] private __gap;
}
