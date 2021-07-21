// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../contracts/StakingBase.sol";

contract TestStaking is StakingBase {

    function getStakeTest(uint amount, uint slope, uint cliff) external pure returns (uint stakeAmount, uint stakeSlope) {
        (stakeAmount, stakeSlope) = getStake(amount, slope, cliff);
    }
}
