// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
using ECDSA for bytes32;

contract RariReward is Initializable, OwnableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    // Roles for access control
    bytes32 public constant SWAP_ROLE = keccak256("SWAP_ROLE");
    bytes32 public constant EPOCH_ROLE = keccak256("EPOCH_ROLE");

    // Reward token (RARI) and accounting variables
    IERC20 public rewardToken;            // RARI token contract
    uint256 public epochIndex;            // current epoch index (starts from 0 or 1 after first update)
    uint256 public totalAllocatedPoints;  // total points allocated (cumulative up to current epoch)
    uint256 public totalConvertedPoints;  // total points that have been converted (claimed) so far (cumulative)
    uint256 public price;                 // price (RARI per point for current epoch, with 18 decimal fixed-point)

    // Events for off-chain tracking
    event EpochUpdated(uint256 indexed epochIndex, uint256 totalAllocatedPoints, uint256 price);
    event RewardClaimed(address indexed user, uint256 epochIndex, uint256 points, uint256 rewardAmount);
    event FeeWithdrawn(address indexed by, address indexed token, uint256 amount, address indexed to);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer function (to replace constructor in upgradeable contract).
     * @param _initialOwner Address of the initial owner of the contract.
     */
    function initialize(address _initialOwner) public initializer {
        require(_initialOwner != address(0), "Invalid owner");
        __Ownable_init(_initialOwner);           // Initialize Ownable (sets owner to msg.sender)
        __AccessControl_init();     // Initialize AccessControl (no roles set yet)
        __ReentrancyGuard_init();   // Initialize ReentrancyGuard

        epochIndex = 0;
        totalAllocatedPoints = 0;
        totalConvertedPoints = 0;
        price = 0;

        // Setup AccessControl roles: the deployer is the default admin
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SWAP_ROLE, msg.sender);
        _grantRole(EPOCH_ROLE, msg.sender);
    }

    /**
     * @dev Allows the Swap service to withdraw collected fees (e.g., ETH or other tokens) for conversion to RARI.
     * This function is restricted to accounts with the SWAP_ROLE.
     * @param token Address of the token to withdraw (use 0x000...0 for ETH).
     * @param amount Amount of the token to withdraw.
     * @param to Address to send the tokens to (should be the swap service or conversion target).
     */
    function withdrawFees(address token, uint256 amount, address to) external onlyRole(SWAP_ROLE) nonReentrant {
        require(to != address(0), "Invalid recipient");
        if (token == address(0)) {
            // Withdraw native ETH
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = to.call{ value: amount }("");
            require(success, "ETH transfer failed");
        } else {
            // Withdraw ERC20 token (e.g., WETH or other fee token)
            IERC20 feeToken = IERC20(token);
            require(feeToken.balanceOf(address(this)) >= amount, "Insufficient token balance");
            feeToken.safeTransfer(to, amount);
        }
        emit FeeWithdrawn(msg.sender, token, amount, to);
    }

    /**
     * @dev Update the reward epoch with new total allocated points and compute a new price per point.
     * Can only be called by an account with the EPOCH_ROLE (backend admin).
     * @param newTotalPoints The new cumulative total of reward points (must be >= previous total).
     *
     * This will increment the epoch index, update the totalAllocatedPoints and price,
     * and thereby invalidate any old signatures from previous epochs.
     */
    function updateEpoch(uint256 newTotalPoints) external onlyRole(EPOCH_ROLE) {
        require(newTotalPoints > totalAllocatedPoints, "Total points must increase");
        // Calculate the number of new points in this epoch that need rewards
        uint256 pointsToReward = newTotalPoints - totalConvertedPoints;
        require(pointsToReward > 0, "No new points to reward");
        // Fetch current RARI token balance of the contract
        uint256 rariBalance = rewardToken.balanceOf(address(this));
        // Calculate price per point in RARI (scaled by 1e18 for precision)
        // price = (rariBalance * 1e18) / pointsToReward
        if (rariBalance == 0) {
            price = 0;
        } else {
            price = (rariBalance * 1e18) / pointsToReward;
        }

        // Update state: epoch and points
        totalAllocatedPoints = newTotalPoints;
        epochIndex += 1;

        emit EpochUpdated(epochIndex, totalAllocatedPoints, price);
    }

    /**
     * @dev Claim RARI token rewards for the caller (user) based on off-chain computed points.
     * The caller must provide a valid signature from the backend (EPOCH_ROLE) for their points and epoch.
     * @param points The number of reward points the user is claiming for the current epoch.
     * @param epoch The epoch index for which the rewards are claimed (must equal current epochIndex).
     * @param signature The signature provided by the backend, authorizing this claim.
     */
    function claimReward(uint256 points, uint256 epoch, bytes calldata signature) external nonReentrant {
        address user = msg.sender;
        require(epoch == epochIndex, "Epoch mismatch");
        require(points > 0, "No points");

        // Recreate the message hash that was signed by the backend:
        // Include critical data: chain ID, contract address, epoch, user address, points
        bytes32 dataHash = keccak256(abi.encodePacked(block.chainid, address(this), epoch, user, points));
        bytes32 messageHash = dataHash.toEthSignedMessageHash();
        // Recover the signer from the signature
        address signer = ECDSA.recover(messageHash, signature);
        // Verify that the signer is authorized (has EPOCH_ROLE)
        require(hasRole(EPOCH_ROLE, signer), "Invalid signature");

        // Calculate reward amount in RARI tokens: (points * price) / 1e18 (since price is scaled)
        uint256 rewardAmount = (points * price) / 1e18;
        require(rewardAmount > 0, "No reward available");

        // Update state to prevent re-use
        totalConvertedPoints += points;

        // Transfer reward tokens to the user
        rewardToken.safeTransfer(user, rewardAmount);

        emit RewardClaimed(user, epoch, points, rewardAmount);
    }

    /**
     * @dev Allow the contract to receive ETH (fees from the Exchange contract).
     */
    receive() external payable {
        // Fees in ETH can be sent directly to this contract.
        // Event could be emitted if needed to track deposits, but not strictly required.
    }
}
