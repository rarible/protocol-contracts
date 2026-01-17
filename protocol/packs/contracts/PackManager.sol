// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// <ai_context>
// PackManager coordinates opening of RARI pack NFTs using Chainlink VRF. It
// selects NFTs from NftPool into specific packs, locks them as pack contents
// while keeping actual ownership inside NftPool, and then lets users either
// claim those NFTs or claim an instant-cash reward. In the instant-cash path,
// NFTs are simply re-added back into NftPool accounting so the pool can
// continue to exist and be reused for future packs. It is designed to work
// together with RariPack and NftPool.
//
// Fallback / recovery:
// - If VRF fulfillment cannot complete (e.g., pool level becomes empty), the
//   request is marked Failed, any partially locked NFTs are rolled back to pool
//   accounting, and the pack is unlocked so it can be opened again.
// - If VRF callback never arrives, pack owners can cancel after a timeout,
//   and the contract owner can cancel immediately.
// - Contract owner can also manually request a new VRF open for a pack.
// </ai_context>

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ERC721HolderUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

import {RariPack} from "./RariPack.sol";
import {NftPool} from "./NftPool.sol";

/// @title PackManager
/// @notice Opens RariPack NFTs and distributes rewards from NftPool using Chainlink VRF
/// @dev Uses Chainlink VRF v2.5 for verifiable randomness when selecting NFTs
/// @dev Selection: first select pool level by probability, then select NFT from that level with equal probability
/// @dev Supports a 2-step flow: open pack (lock contents) and then claim either NFTs or instant cash
contract PackManager is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    ERC721HolderUpgradeable
{
    // -----------------------
    // Types
    // -----------------------

    enum RequestStatus {
        Pending,
        Fulfilled,
        Cancelled,
        Failed
    }

    enum OpenFailReason {
        Unknown,
        LevelSelectionFailed,
        SetPackContentsFailed
    }

    /// @dev Request state for pending VRF callbacks
    struct OpenRequest {
        address requester;
        uint256 packTokenId;
        RariPack.PackType packType;
        bool fulfilled;
        uint64 createdAt;
        RequestStatus status;
    }

    /// @dev Reward NFT info for events
    struct RewardNft {
        address collection;
        uint256 tokenId;
        NftPool.PoolLevel poolLevel;
    }

    /// @dev Probability thresholds for each pack type (cumulative, out of 10000)
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

    /// @dev Single NftPool contract holding all NFTs
    NftPool public nftPool;

    /// @dev VRF Coordinator address
    address public vrfCoordinator;

    /// @dev VRF subscription ID (uint256 for VRF V2.5)
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

    /// @dev Treasury address for excess ETH forwarding
    address public payoutTreasury;



    /// @dev Whether instant cash claims are enabled
    bool public instantCashEnabled;

    /// @dev Pack tokenId => whether a VRF open request is currently in progress
    mapping(uint256 => bool) public packOpeningInProgress;

    /// @dev Whether to pay for VRF with LINK token (true) or native ETH (false, default)
    bool public vrfPayWithLink;

    /// @dev Pack tokenId => currently active open requestId (0 if none)
    mapping(uint256 => uint256) public packToRequestId;

    /// @dev Timeout (seconds) after which a pack owner can cancel a pending VRF request
    uint64 public vrfRequestTimeout;

    /// @dev ETH balance threshold - excess above this is forwarded to payoutTreasury
    uint256 public treasuryThreshold;

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

    event PackOpenFailed(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        OpenFailReason reason
    );

    event PackOpenCancelled(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed packTokenId,
        address cancelledBy
    );

    event LockedNftRollbackFailed(address indexed collection, uint256 indexed tokenId);

    event VrfRequestTimeoutUpdated(uint64 oldTimeout, uint64 newTimeout);

    event InstantCashClaimed(
        address indexed requester,
        uint256 indexed packTokenId,
        uint256 totalPayout,
        address[] collections,
        uint256[] tokenIds
    );

    event NftClaimed(address indexed requester, uint256 indexed packTokenId, address[] collections, uint256[] tokenIds);

    event NftPoolSet(address indexed poolAddress);
    event RariPackSet(address indexed rariPackAddress);
    event VrfConfigUpdated(
        address indexed coordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    );
    event VrfPayWithLinkUpdated(bool payWithLink);
    event PackProbabilitiesUpdated(
        RariPack.PackType indexed packType,
        uint16 ultraRare,
        uint16 legendary,
        uint16 epic,
        uint16 rare
    );
    event PayoutTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event TreasuryThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event InstantCashEnabledUpdated(bool enabled);
    event TreasuryFunded(address indexed funder, uint256 amount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);
    event ExcessForwardedToTreasury(address indexed treasury, uint256 amount);

    // -----------------------
    // Errors
    // -----------------------

    error ZeroAddress();
    error NotPackOwner();
    error PoolNotSet();
    error LevelEmpty(NftPool.PoolLevel level);
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
    error PackAlreadyOpened();
    error PackOpeningInProgressError();
    error PackNotOpened();
    error PackEmpty();
    error NotAuthorized();
    error RequestNotPending();
    error RequestNotTimedOut();
    error NoActiveRequest();

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
        __ERC721Holder_init();

        rariPack = RariPack(rariPack_);
        emit RariPackSet(rariPack_);

        // Set default probabilities
        _setDefaultProbabilities();

        // Instant cash disabled by default
        instantCashEnabled = false;

        // Default cancel timeout for missing VRF callback
        vrfRequestTimeout = 1 hours;
        emit VrfRequestTimeoutUpdated(0, vrfRequestTimeout);
    }

    /// @dev Set default probability thresholds (cumulative, out of 10000)
    /// Higher tier packs have better odds for rare items
    function _setDefaultProbabilities() internal {
        // Platinum (best odds + exclusive UltraRare access):
        // UltraRare 0.5%, Legendary 2%, Epic 7%, Rare 20%, Common 70.5%
        _packProbabilities[RariPack.PackType.Platinum] = PackProbabilities({
            ultraRare: 50, // 0.5%
            legendary: 250, // 2% (cumulative 2.5%)
            epic: 950, // 7% (cumulative 9.5%)
            rare: 2950 // 20% (cumulative 29.5%), Common = 70.5%
        });

        // Gold (great odds, no UltraRare):
        // Legendary 1%, Epic 5%, Rare 15%, Common 79%
        _packProbabilities[RariPack.PackType.Gold] = PackProbabilities({
            ultraRare: 0, // Not available
            legendary: 100, // 1%
            epic: 600, // 5% (cumulative 6%)
            rare: 2100 // 15% (cumulative 21%), Common = 79%
        });

        // Silver (good odds):
        // Legendary 0.5%, Epic 3%, Rare 10%, Common 86.5%
        _packProbabilities[RariPack.PackType.Silver] = PackProbabilities({
            ultraRare: 0, // Not available
            legendary: 50, // 0.5%
            epic: 350, // 3% (cumulative 3.5%)
            rare: 1350 // 10% (cumulative 13.5%), Common = 86.5%
        });

        // Bronze (entry level):
        // Legendary 0.2%, Epic 1%, Rare 5%, Common 93.8%
        _packProbabilities[RariPack.PackType.Bronze] = PackProbabilities({
            ultraRare: 0, // Not available
            legendary: 20, // 0.2%
            epic: 120, // 1% (cumulative 1.2%)
            rare: 620 // 5% (cumulative 6.2%), Common = 93.8%
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

    /// @notice Set the NFT pool contract
    function setNftPool(address pool_) external onlyOwner {
        if (pool_ == address(0)) revert ZeroAddress();
        nftPool = NftPool(pool_);
        emit NftPoolSet(pool_);
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

    /// @notice Set whether to pay for VRF with LINK token or native ETH
    /// @param payWithLink_ true = pay with LINK, false = pay with native ETH (default)
    function setVrfPayWithLink(bool payWithLink_) external onlyOwner {
        vrfPayWithLink = payWithLink_;
        emit VrfPayWithLinkUpdated(payWithLink_);
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

    /// @notice Set the payout treasury address (for excess ETH forwarding)
    function setPayoutTreasury(address treasury_) external onlyOwner {
        address oldTreasury = payoutTreasury;
        payoutTreasury = treasury_;
        emit PayoutTreasuryUpdated(oldTreasury, treasury_);
    }

    /// @notice Set the ETH balance threshold - excess above this is forwarded to payoutTreasury
    /// @param threshold_ The threshold in wei (e.g., 5 ether = 5e18)
    function setTreasuryThreshold(uint256 threshold_) external onlyOwner {
        uint256 oldThreshold = treasuryThreshold;
        treasuryThreshold = threshold_;
        emit TreasuryThresholdUpdated(oldThreshold, threshold_);
    }

    /// @notice Enable or disable instant cash claims
    function setInstantCashEnabled(bool enabled) external onlyOwner {
        instantCashEnabled = enabled;
        emit InstantCashEnabledUpdated(enabled);
    }

    /// @notice Set timeout after which pack owners can cancel stuck VRF requests
    function setVrfRequestTimeout(uint64 timeoutSeconds) external onlyOwner {
        uint64 oldTimeout = vrfRequestTimeout;
        vrfRequestTimeout = timeoutSeconds;
        emit VrfRequestTimeoutUpdated(oldTimeout, timeoutSeconds);
    }

    /// @notice Pause pack opening and claiming
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause pack opening and claiming
    function unpause() external onlyOwner {
        _unpause();
    }

    // -----------------------
    // Treasury Management
    // -----------------------

    /// @notice Fund the contract for instant cash payouts
    function fundTreasury() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
        _forwardExcessToTreasury();
    }

    /// @notice Withdraw funds from the contract
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
        _forwardExcessToTreasury();
    }

    /// @dev Forward excess ETH above threshold to payoutTreasury
    function _forwardExcessToTreasury() internal {
        if (payoutTreasury == address(0) || treasuryThreshold == 0) return;
        
        uint256 balance = address(this).balance;
        if (balance <= treasuryThreshold) return;
        
        uint256 excess = balance - treasuryThreshold;
        (bool sent, ) = payoutTreasury.call{value: excess}("");
        if (sent) {
            emit ExcessForwardedToTreasury(payoutTreasury, excess);
        }
        // If transfer fails, keep the ETH in the contract (no revert to avoid blocking receives)
    }

    // -----------------------
    // Core: Open Pack
    // -----------------------

    /// @notice Request to open a pack and lock NFTs into it
    /// @dev After VRF fulfillment, NFTs are locked inside NftPool and contents are stored in RariPack.
    ///      The pack is not burned during opening.
    function openPack(uint256 packTokenId) external nonReentrant whenNotPaused returns (uint256 requestId) {
        // Verify caller owns the pack
        if (rariPack.ownerOf(packTokenId) != msg.sender) revert NotPackOwner();

        // Ensure pack not already opened
        (, , bool opened) = rariPack.getPackContents(packTokenId);
        if (opened) revert PackAlreadyOpened();

        // Ensure we are not already waiting for VRF for this pack
        if (packOpeningInProgress[packTokenId]) revert PackOpeningInProgressError();

        // Get pack type
        RariPack.PackType packType = rariPack.packTypeOf(packTokenId);

        // Verify pool is set and has NFTs at required levels
        _verifyPoolLevelsAvailable(packType);

        // Request randomness from VRF
        requestId = _requestRandomness();

        // Store request
        openRequests[requestId] = OpenRequest({
            requester: msg.sender,
            packTokenId: packTokenId,
            packType: packType,
            fulfilled: false,
            createdAt: uint64(block.timestamp),
            status: RequestStatus.Pending
        });

        packOpeningInProgress[packTokenId] = true;
        packToRequestId[packTokenId] = requestId;

        _userPendingRequests[msg.sender].push(requestId);

        emit PackOpenRequested(requestId, msg.sender, packTokenId, packType);
    }

    /// @notice Admin-only: manually start VRF open request for a pack
    function adminOpenPack(uint256 packTokenId) external onlyOwner whenNotPaused returns (uint256 requestId) {
        address currentOwner = rariPack.ownerOf(packTokenId);

        (, , bool opened) = rariPack.getPackContents(packTokenId);
        if (opened) revert PackAlreadyOpened();

        if (packOpeningInProgress[packTokenId]) revert PackOpeningInProgressError();

        RariPack.PackType packType = rariPack.packTypeOf(packTokenId);

        _verifyPoolLevelsAvailable(packType);

        requestId = _requestRandomness();

        openRequests[requestId] = OpenRequest({
            requester: currentOwner,
            packTokenId: packTokenId,
            packType: packType,
            fulfilled: false,
            createdAt: uint64(block.timestamp),
            status: RequestStatus.Pending
        });

        packOpeningInProgress[packTokenId] = true;
        packToRequestId[packTokenId] = requestId;

        _userPendingRequests[currentOwner].push(requestId);

        emit PackOpenRequested(requestId, currentOwner, packTokenId, packType);
    }

    /// @notice Cancel a stuck open request by packTokenId (requires packToRequestId to be set)
    function cancelOpenRequest(uint256 packTokenId) external {
        uint256 requestId = packToRequestId[packTokenId];
        if (requestId == 0) revert NoActiveRequest();
        _cancelOpenRequestById(requestId);
    }

    /// @notice Cancel a stuck open request by requestId (works for old requests too)
    function cancelOpenRequestByRequestId(uint256 requestId) external {
        _cancelOpenRequestById(requestId);
    }

    function _cancelOpenRequestById(uint256 requestId) internal {
        OpenRequest storage request = openRequests[requestId];
        if (request.requester == address(0)) revert RequestNotFound();
        if (request.status != RequestStatus.Pending) revert RequestNotPending();

        uint256 packTokenId = request.packTokenId;
        address packOwner = rariPack.ownerOf(packTokenId);

        if (msg.sender != owner() && msg.sender != packOwner) revert NotAuthorized();

        if (msg.sender != owner()) {
            if (block.timestamp < uint256(request.createdAt) + uint256(vrfRequestTimeout)) revert RequestNotTimedOut();
        }

        request.status = RequestStatus.Cancelled;

        _finalizeOpenRequest(requestId, request);

        emit PackOpenCancelled(requestId, request.requester, packTokenId, msg.sender);
    }

    /// @notice Callback function for VRF Coordinator
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != vrfCoordinator) revert OnlyVrfCoordinator();
        _fulfillRandomWords(requestId, randomWords);
    }

    // -----------------------
    // Internal: VRF (Chainlink VRF V2.5)
    // -----------------------

    function _requestRandomness() internal returns (uint256 requestId) {
        if (vrfCoordinator == address(0)) revert InvalidVrfCoordinator();

        // Build extraArgs for V2.5 using official Chainlink library
        // vrfPayWithLink: false = native ETH (default), true = LINK
        // nativePayment param: true = pay with native, false = pay with LINK
        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(
            VRFV2PlusClient.ExtraArgsV1({nativePayment: !vrfPayWithLink})
        );

        // Build the V2.5 request struct using official Chainlink library
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: vrfKeyHash,
            subId: vrfSubscriptionId,
            requestConfirmations: vrfRequestConfirmations,
            callbackGasLimit: vrfCallbackGasLimit,
            numWords: uint32(REWARDS_PER_PACK),
            extraArgs: extraArgs
        });

        // Call VRF V2.5 Coordinator
        requestId = IVRFCoordinatorV2Plus(vrfCoordinator).requestRandomWords(req);
    }

    function _fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal {
        OpenRequest storage request = openRequests[requestId];
        if (request.requester == address(0)) revert RequestNotFound();

        if (request.status != RequestStatus.Pending) {
            return;
        }

        (bool ok, RewardNft[3] memory rewards, OpenFailReason reason) = _processOpenSafe(request, randomWords);

        if (ok) {
            request.fulfilled = true;
            request.status = RequestStatus.Fulfilled;
            emit PackOpened(requestId, request.requester, request.packTokenId, rewards);
        } else {
            request.fulfilled = false;
            request.status = RequestStatus.Failed;
            emit PackOpenFailed(requestId, request.requester, request.packTokenId, reason);
        }

        _finalizeOpenRequest(requestId, request);
    }

    function _finalizeOpenRequest(uint256 requestId, OpenRequest storage request) internal {
        uint256 packTokenId = request.packTokenId;

        packOpeningInProgress[packTokenId] = false;

        if (packToRequestId[packTokenId] == requestId) {
            packToRequestId[packTokenId] = 0;
        }

        _removePendingRequest(request.requester, requestId);
    }

    /// @dev Process opening of a pack - select and lock NFTs into the pack (safe, non-sticky)
    function _processOpenSafe(
        OpenRequest storage request,
        uint256[] calldata randomWords
    ) internal returns (bool ok, RewardNft[3] memory rewards, OpenFailReason reason) {
        address[] memory collections = new address[](REWARDS_PER_PACK);
        uint256[] memory tokenIds = new uint256[](REWARDS_PER_PACK);

        for (uint256 i = 0; i < REWARDS_PER_PACK; i++) {
            uint256 randomValue = randomWords[i];

            NftPool.PoolLevel level = _selectPoolLevel(request.packType, randomValue);

            try nftPool.selectAndLockFromLevel(level, randomValue >> 16) returns (address collection, uint256 tokenId) {
                rewards[i] = RewardNft({collection: collection, tokenId: tokenId, poolLevel: level});
                collections[i] = collection;
                tokenIds[i] = tokenId;
            } catch {
                _rollbackLockedNfts(collections, tokenIds, i);
                return (false, rewards, OpenFailReason.LevelSelectionFailed);
            }
        }

        try rariPack.setPackContents(request.packTokenId, collections, tokenIds) {
            return (true, rewards, OpenFailReason.Unknown);
        } catch {
            _rollbackLockedNfts(collections, tokenIds, REWARDS_PER_PACK);
            return (false, rewards, OpenFailReason.SetPackContentsFailed);
        }
    }

    function _rollbackLockedNfts(address[] memory collections, uint256[] memory tokenIds, uint256 count) internal {
        for (uint256 i = 0; i < count; i++) {
            address collection = collections[i];
            uint256 tokenId = tokenIds[i];
            if (collection == address(0)) {
                continue;
            }
            try nftPool.addLockedNft(collection, tokenId) {} catch {
                emit LockedNftRollbackFailed(collection, tokenId);
            }
        }
    }

    // -----------------------
    // Claims
    // -----------------------

    /// @notice Claim the NFTs locked in an opened pack and burn the pack.
    function claimNft(uint256 packTokenId) external nonReentrant whenNotPaused {
        if (rariPack.ownerOf(packTokenId) != msg.sender) revert NotPackOwner();

        (address[] memory collections, uint256[] memory tokenIds, bool opened) = rariPack.getPackContents(packTokenId);
        if (!opened) revert PackNotOpened();
        if (collections.length == 0) revert PackEmpty();

        for (uint256 i = 0; i < collections.length; i++) {
            nftPool.transferLockedNft(collections[i], msg.sender, tokenIds[i]);
        }

        rariPack.burnPack(packTokenId);

        emit NftClaimed(msg.sender, packTokenId, collections, tokenIds);
    }

    /// @notice Claim instant cash reward for an opened pack and burn the pack.
    /// @dev Locked NFTs remain owned by NftPool and are re-added to pool accounting
    ///      so the pool can continue to serve future packs, while the caller receives ETH.
    function claimReward(uint256 packTokenId) external nonReentrant whenNotPaused {
        if (!instantCashEnabled) revert InstantCashNotEnabled();

        if (rariPack.ownerOf(packTokenId) != msg.sender) revert NotPackOwner();

        (address[] memory collections, uint256[] memory tokenIds, bool opened) = rariPack.getPackContents(packTokenId);
        if (!opened) revert PackNotOpened();
        if (collections.length == 0) revert PackEmpty();

        uint256 totalPayout = 0;

        // Calculate payout based on collection floor prices
        for (uint256 i = 0; i < collections.length; i++) {
            uint256 floorPrice = nftPool.getCollectionFloorPrice(collections[i]);
            if (floorPrice == 0) revert FloorPriceNotSet(collections[i]);

            uint256 payout = (floorPrice * INSTANT_CASH_PERCENTAGE) / PROBABILITY_PRECISION;
            totalPayout += payout;
        }

        if (address(this).balance < totalPayout) revert InsufficientTreasuryBalance();

        // Re-add NFTs back into the pool accounting (they never left the pool contract)
        for (uint256 i = 0; i < collections.length; i++) {
            nftPool.addLockedNft(collections[i], tokenIds[i]);
        }

        // Burn pack
        rariPack.burnPack(packTokenId);

        // Send ETH payout to claimer
        (bool sent, ) = msg.sender.call{value: totalPayout}("");
        if (!sent) revert TransferFailed();

        emit InstantCashClaimed(msg.sender, packTokenId, totalPayout, collections, tokenIds);
    }

    // -----------------------
    // Internal: Pool Level Selection
    // -----------------------

    /// @dev Select pool level based on pack type and random value
    function _selectPoolLevel(
        RariPack.PackType packType,
        uint256 randomValue
    ) internal view returns (NftPool.PoolLevel) {
        uint256 roll = randomValue % PROBABILITY_PRECISION;
        PackProbabilities storage probs = _packProbabilities[packType];

        // For Platinum, check UltraRare first
        if (packType == RariPack.PackType.Platinum && roll < probs.ultraRare) {
            return NftPool.PoolLevel.UltraRare;
        }

        if (roll < probs.legendary) return NftPool.PoolLevel.Legendary;
        if (roll < probs.epic) return NftPool.PoolLevel.Epic;
        if (roll < probs.rare) return NftPool.PoolLevel.Rare;
        return NftPool.PoolLevel.Common;
    }

    /// @dev Verify that pool levels needed for pack type have NFTs
    function _verifyPoolLevelsAvailable(RariPack.PackType packType) internal view {
        if (address(nftPool) == address(0)) revert PoolNotSet();

        // Check required levels have NFTs
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Common) == 0) revert LevelEmpty(NftPool.PoolLevel.Common);
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Rare) == 0) revert LevelEmpty(NftPool.PoolLevel.Rare);
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Epic) == 0) revert LevelEmpty(NftPool.PoolLevel.Epic);
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Legendary) == 0) revert LevelEmpty(NftPool.PoolLevel.Legendary);

        PackProbabilities storage probs = _packProbabilities[packType];
        if (packType == RariPack.PackType.Platinum && probs.ultraRare > 0) {
            if (nftPool.getPoolLevelSize(NftPool.PoolLevel.UltraRare) == 0) {
                revert LevelEmpty(NftPool.PoolLevel.UltraRare);
            }
        }
    }

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

    /// @notice Get individual pool probabilities as percentages (in basis points)
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

    /// @notice Check if pack can be opened (pool configured and levels have NFTs)
    function canOpenPack(RariPack.PackType packType) external view returns (bool) {
        if (address(nftPool) == address(0)) return false;

        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Common) == 0) return false;
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Rare) == 0) return false;
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Epic) == 0) return false;
        if (nftPool.getPoolLevelSize(NftPool.PoolLevel.Legendary) == 0) return false;

        PackProbabilities storage probs = _packProbabilities[packType];
        if (packType == RariPack.PackType.Platinum && probs.ultraRare > 0) {
            if (nftPool.getPoolLevelSize(NftPool.PoolLevel.UltraRare) == 0) return false;
        }

        return true;
    }

    /// @notice Get the NFT pool address
    function getNftPool() external view returns (address) {
        return address(nftPool);
    }

    /// @notice Calculate potential instant cash payout for a collection
    function getInstantCashPayout(address collection) external view returns (uint256 payout) {
        if (address(nftPool) == address(0)) return 0;
        uint256 floorPrice = nftPool.getCollectionFloorPrice(collection);
        if (floorPrice == 0) return 0;
        payout = (floorPrice * INSTANT_CASH_PERCENTAGE) / PROBABILITY_PRECISION;
    }

    /// @notice Get the instant cash percentage (80%)
    function getInstantCashPercentage() external pure returns (uint256) {
        return INSTANT_CASH_PERCENTAGE;
    }

    /// @notice Get active requestId for a pack (0 if none)
    function getActiveRequestIdForPack(uint256 packTokenId) external view returns (uint256) {
        return packToRequestId[packTokenId];
    }

    // -----------------------
    // Storage Gap
    // -----------------------

    uint256[31] private __gap;
}
