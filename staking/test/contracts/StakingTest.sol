// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract StakingTest {
    Staking public staking;

    function _createLock(address account, uint amount, uint period, uint cliff) external returns (uint) {
//        return staking.createLock(account, amount, period, cliff);
//        return Staking.createLock(account, amount, period, cliff);
    }

    function _balanceOf(address account) external view returns (uint) {
//        return staking.balanceOf(account);
//        return Staking.balanceOf(account);
    }

    function sum(uint a, uint b) external view returns (uint) {
        return staking.testLibSum(a, b);
    }
}
