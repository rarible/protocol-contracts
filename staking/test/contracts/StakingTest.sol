// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract StakingTest {
    event createLockResult(uint result);
    event balanceOfResult(uint result);

    function _createLock(address staking, address account, uint amount, uint period, uint cliff) external {
        Staking stakingTest = Staking(staking);
        uint result =  stakingTest.createLock(account, amount, period, cliff);
        emit createLockResult(result);
    }

    function _balanceOf(address staking, address account) external {
        Staking stakingTest = Staking(staking);
        uint result =  stakingTest.balanceOf(account);
        emit balanceOfResult(result);
    }
}
