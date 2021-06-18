// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract StakingTest {
    event createLockResult(uint result);
    event balanceOfResult(uint result);
    event totalBalanceResult(uint result);
    event reStakeResult(uint result);

    Staking public stakingTestContract;

    function __StakingTest_init(Staking staking) external {
        stakingTestContract = staking;
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
        uint result = stakingTest.restake(idLock, delegate, newAmount, newSlope, newCliff);
        emit reStakeResult(result);
    }

    function _delegateTo(address staking, uint idLock, address newDelegate) external {
        Staking stakingTest = Staking(staking);
        stakingTest.delegateTo(idLock, newDelegate);
    }
}
