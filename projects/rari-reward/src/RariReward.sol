// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title RariReward
 * @notice Reward distribution contract for an NFT Exchange.
 *
 * High-level:
 * - Exchange forwards fees here (ETH or other tokens).
 * - Off-chain Swap service pulls fees (EXCEPT rewardToken) to convert into RARI and sends RARI back here.
 * - Backend (EPOCH_ROLE) updates epochs with cumulative total points => contract computes price per point.
 * - Users claim with a backend signature for (epoch, user, cumulativePoints). Contract pays only the delta that
 *   hasn't been claimed yet for that epoch.
 *
 * Key invariants:
 * - price is scaled by 1e18 (PRICE_SCALE).
 * - totalAllocatedPoints is cumulative across all time.
 * - totalConvertedPoints tracks cumulative points that have actually been paid out.
 * - On updateEpoch(newTotalPoints), price is set from the current RARI balance and the remaining unconverted points.
 */
contract RariReward is Initializable, OwnableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, IERC20 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ========= Roles =========
    bytes32 public constant SWAP_ROLE = keccak256("SWAP_ROLE");   // Can withdraw non-RARI fees for swapping
    bytes32 public constant EPOCH_ROLE = keccak256("EPOCH_ROLE"); // Can update epoch & acts as signer for claims

    // ========= Constants =========
    uint256 public constant PRICE_SCALE = 1e18;

    // ========= Params / State =========
    IERC20 public rewardToken;            // RARI token contract (assumed 18 decimals)
    uint256 public epochIndex;            // current epoch index (starts at 0 and increments on updateEpoch)
    uint256 public totalAllocatedPoints;  // cumulative total points assigned by backend up to current epoch
    uint256 public totalConvertedPoints;  // cumulative total points that have been claimed/converted
    uint256 public price;                 // RARI per point for current epoch (scaled by 1e18)

    // user cumulative points already claimed
    mapping(address => uint256) public claimedPoints;

    // ========= Events =========
    event EpochUpdated(uint256 indexed epochIndex, uint256 totalAllocatedPoints, uint256 price);
    event RewardClaimed(address indexed user, uint256 indexed epochIndex, uint256 pointsClaimed, uint256 rewardAmount);
    event FeeWithdrawn(address indexed by, address indexed token, uint256 amount, address indexed to);
    event RewardTokenSet(address indexed rewardToken);
    event RewardTokenWithdrawn(uint256 amount, address indexed to);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer function (to replace constructor in upgradeable contract).
     * @param _initialOwner Address of the initial owner/admin.
     */
    function initialize(address _initialOwner) public initializer {
        require(_initialOwner != address(0), "Invalid owner");

        __Ownable_init(_initialOwner);
        __AccessControl_init();
        __ReentrancyGuard_init();

        epochIndex = 0;
        totalAllocatedPoints = 0;
        totalConvertedPoints = 0;
        price = 0;

        // Grant roles to the owner
        _grantRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _grantRole(SWAP_ROLE, _initialOwner);
        _grantRole(EPOCH_ROLE, _initialOwner);
    }

    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = IERC20(_rewardToken);
        emit RewardTokenSet(_rewardToken);
    }

    /**
     * @notice Allows the Swap service to withdraw collected fees (ETH or non-RARI ERC20) for conversion to RARI.
     * @dev Restricted to SWAP_ROLE. Cannot withdraw the rewardToken (RARI).
     * @param token Address of the token to withdraw (use address(0) for ETH).
     * @param amount Amount to withdraw.
     * @param to Recipient of the funds (swap executor).
     */
    function withdrawFees(address token, uint256 amount, address to) external onlyRole(SWAP_ROLE) nonReentrant {
        require(to != address(0), "Invalid recipient");
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            (bool success, ) = to.call{ value: amount }("");
            require(success, "ETH transfer failed");
        } else {
            require(token != address(rewardToken), "Cannot withdraw reward token");
            IERC20(token).safeTransfer(to, amount);
        }
        emit FeeWithdrawn(msg.sender, token, amount, to);
    }

    /**
     * @notice Allows the owner to withdraw the reward token.
     * @dev Only the owner can withdraw the reward token.
     * @param amount Amount to withdraw.
     * @param to Recipient of the reward token.
     */
    function withdrawRewardToken(uint256 amount, address to) external onlyOwner {
        rewardToken.safeTransfer(to, amount);
        emit RewardTokenWithdrawn(amount, to);
    }

    /**
     * @notice Update the reward epoch with new total allocated points.
     * @dev Only EPOCH_ROLE. Computes a new price per point from current RARI balance and remaining points.
     *      - newTotalPoints must strictly increase.
     *      - pointsToReward = newTotalPoints - totalConvertedPoints must be > 0
     * @param newTotalPoints The new cumulative total points across all users.
     */
    function updateEpoch(uint256 newTotalPoints) external onlyRole(EPOCH_ROLE) {
        require(newTotalPoints > totalAllocatedPoints, "Total points must increase");

        // Remaining points that still need to be paid across all time after this update
        uint256 pointsToReward = newTotalPoints > totalConvertedPoints
            ? (newTotalPoints - totalConvertedPoints)
            : 0;
        require(pointsToReward > 0, "No new points to reward");

        // Determine new price from the current RARI token balance
        uint256 rariBalance = rewardToken.balanceOf(address(this));
        if (rariBalance == 0) {
            price = 0;
        } else {
            // price scaled by 1e18
            price = (rariBalance * PRICE_SCALE) / pointsToReward;
        }

        totalAllocatedPoints = newTotalPoints;
        epochIndex += 1;

        emit EpochUpdated(epochIndex, totalAllocatedPoints, price);
    }

    /**
     * @notice Claim RARI rewards for the caller, using a backend signature for (epoch, user, cumulative points).
     * @dev Signature must be from an address with EPOCH_ROLE.
     *      The contract pays only the delta = signedPoints - alreadyClaimed[user].
     * @param pointsToClaim points user wants to claim.
     * @param totalPoints CUMULATIVE points allocated to the user for this epoch.
     * @param epoch  The epoch index being claimed (must equal current epochIndex).
     * @param signature Backend signature over the claim (see claimMessageHash()).
     */
    function claimReward(uint256 pointsToClaim, uint256 totalPoints, uint256 epoch, bytes calldata signature) external nonReentrant {
        address user = msg.sender;
        require(epoch == epochIndex, "Epoch mismatch");
        require(pointsToClaim > 0, "No points to claim");
        require(totalPoints > 0, "Total points must be greater than 0");

        // Recreate the message hash that was signed by the backend
        // dataHash = keccak256(chainid, contract, epoch, user, points) -> toEthSignedMessageHash()
        bytes32 dataHash = keccak256(abi.encodePacked(address(this), epoch, user, totalPoints));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(dataHash);

        // Recover signer and verify it has EPOCH_ROLE
        address signer = ECDSA.recover(ethHash, signature);
        require(hasRole(EPOCH_ROLE, signer), "Invalid signature");

        // Compute delta claimable points for this user/epoch
        uint256 already = claimedPoints[user];
        require(totalPoints > already, "Nothing claimable");
        uint256 delta = totalPoints - already;
        require(pointsToClaim <= delta, "Points to claim must be less than or equal to delta");

        // Compute reward amount from price (scaled by PRICE_SCALE)
        uint256 rewardAmount = (pointsToClaim * price) / PRICE_SCALE;
        require(rewardAmount > 0, "No reward available");

        // State updates
        claimedPoints[user] += pointsToClaim;       // store cumulative claimed
        totalConvertedPoints += pointsToClaim;             // track cumulatively converted points

        // Effects
        rewardToken.safeTransfer(user, rewardAmount);

        emit RewardClaimed(user, epoch, pointsToClaim, rewardAmount);
        emit Transfer(address(0), user, rewardAmount);
    }

    /**
     * @notice View helper: returns claimable points and amount given a signed "cumulative points" value.
     */
    function getClaimable(address user, uint256 epoch, uint256 signedCumulativePoints)
        external
        view
        returns (uint256 claimablePoints, uint256 claimableAmount)
    {
        if (epoch != epochIndex) return (0, 0);
        uint256 already = claimedPoints[user];
        if (signedCumulativePoints <= already) return (0, 0);
        uint256 delta = signedCumulativePoints - already;
        return (delta, (delta * price) / PRICE_SCALE);
    }

    /**
     * @notice Helper to generate the off-chain message hash for signing.
     * @dev Backends can call this in tests to build the exact message to sign.
     */
    function claimMessageHash(address user, uint256 epoch, uint256 points) external view returns (bytes32) {
        bytes32 dataHash = keccak256(abi.encodePacked(block.chainid, address(this), epoch, user, points));
        return dataHash.toEthSignedMessageHash();
    }

    /**
     * @dev Allow the contract to receive ETH (fees from the Exchange contract).
     */
    receive() external payable {}

    // ========= ERC20 Functions (view-only; non-transferable) =========

    /// @notice Returns the name of the token.
    function name() public pure returns (string memory) {
        return "Rari Reward Points";
    }

    /// @notice Returns the symbol of the token.
    function symbol() public pure returns (string memory) {
        return "RariRP";
    }

    /// @notice Returns the number of decimals of the token.
    function decimals() public pure returns (uint8) {
        return 18;
    }

    /// @notice Total supply equals total converted (claimed) points.
    function totalSupply() public view override returns (uint256) {
        return totalConvertedPoints;
    }

    /// @notice Balance equals user's cumulative claimed points.
    function balanceOf(address account) public view override returns (uint256) {
        return claimedPoints[account];
    }

    /**
     * @notice Non-transferable: always reverts.
     */
    function transfer(address /* to */, uint256 /* amount */) external pure override returns (bool) {
        revert("NON_TRANSFERABLE");
    }

    /**
     * @notice Allowance is always zero for a non-transferable token.
     */
    function allowance(address /* owner */, address /* spender */) public pure override returns (uint256) {
        return 0;
    }

    /**
     * @notice Approvals are not supported: always reverts.
     */
    function approve(address /* spender */, uint256 /* amount */) public pure override returns (bool) {
        revert("NON_TRANSFERABLE");
    }

    /**
     * @notice Transfers via allowance are not supported: always reverts.
     */
    function transferFrom(address /* from */, address /* to */, uint256 /* amount */) public pure override returns (bool) {
        revert("NON_TRANSFERABLE");
    }
    
}