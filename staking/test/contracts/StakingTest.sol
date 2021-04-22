// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract StakingTest {
//    Staking public staking;
    event createLockResult(uint result);

    function _createLock(address staking, address account, uint amount, uint period, uint cliff) external returns (uint) {
        Staking stakingTest = Staking(staking);
        uint result =  stakingTest.createLock(account, amount, period, cliff);
//        return Staking.createLock(account, amount, period, cliff);
        emit createLockResult(result);
    }

    function _balanceOf(address account) external view returns (uint) {
//        return staking.balanceOf(account);
//        return Staking.balanceOf(account);
    }

//    function sum(uint a, uint b) external view returns (uint) {
//        return staking.testLibSum(a, b);
//    }

//    event getRoyaltiesTest(LibPart.Part[] royalties);
//
//    function _getRoyalties(address royaltiesTest, address token, uint tokenId) external {
//        IRoyaltiesProvider withRoyalties = IRoyaltiesProvider(royaltiesTest);
//        LibPart.Part[] memory royalties =  withRoyalties.getRoyalties(token, tokenId);
//        emit getRoyaltiesTest(royalties);
//    }
}
