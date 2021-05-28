// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract StakingTest {
    event createLockResult(uint result);
    event balanceOfResult(uint result);
    event totalBalanceResult(uint result);
    event reStakeResult(uint result);

    function _createLock(address staking, address account, uint amount, uint slope, uint cliff) external {
        Staking stakingTest = Staking(staking);
        uint result = stakingTest.stake(account, amount, slope, cliff, address(0));
        emit createLockResult(result);
    }

    function _balanceOf(address staking, address account) external {
        Staking stakingTest = Staking(staking);
        uint result = stakingTest.balanceOf(account);
        emit balanceOfResult(result);
    }

    function _totalSupply(address staking) external {
        Staking stakingTest = Staking(staking);
        uint result = stakingTest.totalSupply();
        emit totalBalanceResult(result);
    }

    function _restake(address staking, uint idLock, uint newAmount, uint newSlope, uint newCliff) external {
        Staking stakingTest = Staking(staking);
        uint result = stakingTest.reStake(idLock, newAmount, newSlope, newCliff, address(0));
        emit reStakeResult(result);
    }
}
