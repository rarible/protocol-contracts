// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";
import { RariReward } from '../RariReward.sol';

// Test contract for backend tests
contract TestRariReward is RariReward {
    function emitRewardClaimed(uint256 epoch, uint256 pointsToClaim, uint256 rewardAmount) external {
        emit RewardClaimed(msg.sender, epoch, pointsToClaim, rewardAmount);
    }
}
