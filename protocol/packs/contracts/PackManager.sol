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
/// @dev Supports instant cash claim (80% of floor price) or NFT claim
contract PackManager is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    // -----------------------
    // Types
    // -----------------------

    /// @dev Claim type for pack rewards
    enum ClaimType {
        NFT, // Receive the actual NFT tokens
        InstantCash // Receive 80% of floor price in ETH
    }

    /// @dev Request state for pending VRF callbacks
    struct OpenRequest {
        address requester;
        uint256 packTokenId;
        RariPack.PackType packType;
        ClaimType claimType;
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

    /// @dev Instant cash payout percentage (8000 = 80%)
    uint256 public constant INSTANT_CASH_PERCENTAGE = 8000;

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

    /// @dev NFT collection => floor price in wei
    mapping(address => uint256) public collectionFloorPrice;

    /// @dev Treasury address for instant cash payouts
    address public payoutTreasury;

    /// @dev Whether instant cash claims are enabled
    bool public instantCashEnabled;

    // -----------------------
    // Events
    // -----------------------

    event PackOpenRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        RariPack.PackType packType,
        ClaimType claimType
    );

    event PackOpened(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        RewardNft[3] rewards
    );

    event InstantCashClaimed(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        uint256 totalPayout,
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
    event CollectionFloorPriceUpdated(address indexed collection, uint256 oldPrice, uint256 newPrice);
    event PayoutTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event InstantCashEnabledUpdated(bool enabled);
    event TreasuryFunded(address indexed funder, uint256 amount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

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
    error InstantCashNotEnabled();
    error FloorPriceNotSet(address collection);
    error InsufficientTreasuryBalance();
    error PayoutTreasuryNotSet();
    error TransferFailed();

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

        // Instant cash disabled by default
        instantCashEnabled = false;
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
    function setPackProbabilities(
        RariPack.PackType packType,
        uint16 ultraRare,
        uint16 legendary,
        uint16 epic,
        uint16 rare
    ) external onlyOwner {
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

    /// @notice Set floor price for an NFT collection
    /// @param collection NFT collection address
    /// @param floorPrice Floor price in wei
    function setCollectionFloorPrice(address collection, uint256 floorPrice) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        uint256 oldPrice = collectionFloorPrice[collection];
        collectionFloorPrice[collection] = floorPrice;
        emit CollectionFloorPriceUpdated(collection, oldPrice, floorPrice);
    }

    /// @notice Batch set floor prices for multiple collections
    /// @param collections Array of NFT collection addresses
    /// @param floorPrices Array of floor prices in wei
    function setCollectionFloorPrices(
        address[] calldata collections,
        uint256[] calldata floorPrices
    ) external onlyOwner {
        require(collections.length == floorPrices.length, "PackManager: length mismatch");
        for (uint256 i = 0; i < collections.length; i++) {
            if (collections[i] == address(0)) revert ZeroAddress();
            uint256 oldPrice = collectionFloorPrice[collections[i]];
            collectionFloorPrice[collections[i]] = floorPrices[i];
            emit CollectionFloorPriceUpdated(collections[i], oldPrice, floorPrices[i]);
        }
    }

    /// @notice Set the payout treasury address
    /// @param treasury_ Address that holds ETH for instant cash payouts
    function setPayoutTreasury(address treasury_) external onlyOwner {
        address oldTreasury = payoutTreasury;
        payoutTreasury = treasury_;
        emit PayoutTreasuryUpdated(oldTreasury, treasury_);
    }

    /// @notice Enable or disable instant cash claims
    /// @param enabled Whether instant cash claims are enabled
    function setInstantCashEnabled(bool enabled) external onlyOwner {
        instantCashEnabled = enabled;
        emit InstantCashEnabledUpdated(enabled);
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
    // Treasury Management
    // -----------------------

    /// @notice Fund the contract for instant cash payouts
    /// @dev Anyone can fund the treasury
    function fundTreasury() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
    }

    /// @notice Withdraw funds from the contract
    /// @param to Address to send funds to
    /// @param amount Amount to withdraw
    function withdrawTreasury(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert InsufficientTreasuryBalance();

        (bool sent, ) = to.call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit TreasuryWithdrawn(to, amount);
    }

    /// @notice Get contract ETH balance for payouts
    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
    }

    // -----------------------
    // Core: Open Pack
    // -----------------------

    /// @notice Request to open a pack and receive NFTs
    /// @param packTokenId The token ID of the pack to open
    /// @return requestId The VRF request ID
    function openPack(uint256 packTokenId) external nonReentrant whenNotPaused returns (uint256 requestId) {
        return _openPack(packTokenId, ClaimType.NFT);
    }

    /// @notice Request to open a pack and receive instant cash (80% of floor price)
    /// @param packTokenId The token ID of the pack to open
    /// @return requestId The VRF request ID
    function openPackInstantCash(uint256 packTokenId) external nonReentrant whenNotPaused returns (uint256 requestId) {
        if (!instantCashEnabled) revert InstantCashNotEnabled();
        return _openPack(packTokenId, ClaimType.InstantCash);
    }

    /// @dev Internal pack opening logic
    function _openPack(uint256 packTokenId, ClaimType claimType) internal returns (uint256 requestId) {
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
            claimType: claimType,
            fulfilled: false
        });

        _userPendingRequests[msg.sender].push(requestId);

        emit PackOpenRequested(requestId, msg.sender, packTokenId, packType, claimType);
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

        bytes memory data = abi.encodeWithSignature(
            "requestRandomWords(bytes32,uint256,uint16,uint32,uint32)",
            vrfKeyHash,
            vrfSubscriptionId,
            vrfRequestConfirmations,
            vrfCallbackGasLimit,
            uint32(REWARDS_PER_PACK)
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

        // Process based on claim type
        if (request.claimType == ClaimType.InstantCash) {
            _processInstantCashClaim(requestId, request, randomWords);
        } else {
            _processNftClaim(requestId, request, randomWords);
        }

        // Remove from pending requests
        _removePendingRequest(request.requester, requestId);
    }

    /// @dev Process NFT claim - select and transfer NFTs to user immediately
    /// @dev Transfer happens during selection to avoid selecting same NFT twice
    function _processNftClaim(
        uint256 requestId,
        OpenRequest storage request,
        uint256[] calldata randomWords
    ) internal {
        RewardNft[3] memory rewards;

        for (uint256 i = 0; i < REWARDS_PER_PACK; i++) {
            uint256 randomValue = randomWords[i];

            // Determine pool type based on probability
            NftPool.PoolType poolType = _selectPoolType(request.packType, randomValue);

            // Get pool and select random NFT
            NftPool pool = pools[poolType];

            // Select random NFT from pool (use current pool size which decreases as NFTs are transferred)
            uint256 poolSize = pool.poolSize();
            uint256 nftIndex = randomValue % poolSize;

            (address collection, uint256 tokenId) = pool.poolNftAt(nftIndex);

            // Transfer NFT to requester immediately (this removes it from pool)
            pool.transferNft(collection, request.requester, tokenId);

            rewards[i] = RewardNft({collection: collection, tokenId: tokenId, poolType: poolType});
        }

        emit PackOpened(requestId, request.requester, request.packTokenId, rewards);
    }

    /// @dev Process instant cash claim - calculate payout and send ETH
    /// @dev NFTs are NOT transferred, they stay in pools for future claims
    function _processInstantCashClaim(
        uint256 requestId,
        OpenRequest storage request,
        uint256[] calldata randomWords
    ) internal {
        RewardNft[3] memory rewards;
        uint256 totalPayout = 0;

        // Select NFTs and calculate payout (but don't transfer NFTs)
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

            rewards[i] = RewardNft({collection: collection, tokenId: tokenId, poolType: poolType});

            // Calculate payout based on floor price
            uint256 floorPrice = collectionFloorPrice[collection];
            if (floorPrice == 0) revert FloorPriceNotSet(collection);

            // 80% of floor price
            uint256 payout = (floorPrice * INSTANT_CASH_PERCENTAGE) / PROBABILITY_PRECISION;
            totalPayout += payout;
        }

        // Verify sufficient balance
        if (address(this).balance < totalPayout) revert InsufficientTreasuryBalance();

        // Send ETH to user
        (bool sent, ) = request.requester.call{value: totalPayout}("");
        if (!sent) revert TransferFailed();

        // NFTs stay in the pools (not transferred)

        emit InstantCashClaimed(requestId, request.requester, request.packTokenId, totalPayout, rewards);
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
        _verifyPoolHasNfts(NftPool.PoolType.Common);
        _verifyPoolHasNfts(NftPool.PoolType.Rare);
        _verifyPoolHasNfts(NftPool.PoolType.Epic);
        _verifyPoolHasNfts(NftPool.PoolType.Legendary);

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
    function getPackProbabilities(
        RariPack.PackType packType
    ) external view returns (uint16 ultraRare, uint16 legendary, uint16 epic, uint16 rare) {
        PackProbabilities storage probs = _packProbabilities[packType];
        return (probs.ultraRare, probs.legendary, probs.epic, probs.rare);
    }

    /// @notice Get individual pool probabilities as percentages (in basis points, 100 = 1%)
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
        if (address(pools[NftPool.PoolType.Common]) == address(0)) return false;
        if (pools[NftPool.PoolType.Common].poolSize() == 0) return false;

        if (address(pools[NftPool.PoolType.Rare]) == address(0)) return false;
        if (pools[NftPool.PoolType.Rare].poolSize() == 0) return false;

        if (address(pools[NftPool.PoolType.Epic]) == address(0)) return false;
        if (pools[NftPool.PoolType.Epic].poolSize() == 0) return false;

        if (address(pools[NftPool.PoolType.Legendary]) == address(0)) return false;
        if (pools[NftPool.PoolType.Legendary].poolSize() == 0) return false;

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

    /// @notice Calculate potential instant cash payout for a collection
    /// @param collection NFT collection address
    /// @return payout 80% of floor price in wei
    function getInstantCashPayout(address collection) external view returns (uint256 payout) {
        uint256 floorPrice = collectionFloorPrice[collection];
        if (floorPrice == 0) return 0;
        payout = (floorPrice * INSTANT_CASH_PERCENTAGE) / PROBABILITY_PRECISION;
    }

    /// @notice Get the instant cash percentage (80%)
    function getInstantCashPercentage() external pure returns (uint256) {
        return INSTANT_CASH_PERCENTAGE;
    }

    // -----------------------
    // Storage Gap
    // -----------------------

    uint256[35] private __gap;
}
