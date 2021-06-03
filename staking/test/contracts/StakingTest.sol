// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract StakingTest {
    event createLockResult(uint result);
    event balanceOfResult(uint result);
    event totalBalanceResult(uint result);
    event reStakeResult(uint result);

    function _stake(address staking, address locker, address delegate, uint amount, uint slope, uint cliff) external {
        Staking stakingTest = Staking(staking);
        uint result = stakingTest.stake(locker, delegate, amount, slope, cliff);
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

    function _restake(address staking, uint idLock, address delegate, uint newAmount, uint newSlope, uint newCliff) external {
        Staking stakingTest = Staking(staking);
        uint result = stakingTest.reStake(idLock, delegate, newAmount, newSlope, newCliff);
        emit reStakeResult(result);
    }

    function _delegate(address staking, uint idLock, address newDelegate) external {
        Staking stakingTest = Staking(staking);
        stakingTest.delegate(idLock, newDelegate);
    }
}
