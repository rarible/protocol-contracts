// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract TestStaking is Staking {

    uint public blockNumberMocked;

    function incrementBlock (uint _amount) external {
        blockNumberMocked = blockNumberMocked + _amount;
    }

    function getBlockNumber() internal override view returns (uint) {
        return blockNumberMocked;
    }

    function getStakeTest(uint amount, uint slope, uint cliff) external view returns (uint stakeAmount, uint stakeSlope) {
        (stakeAmount, stakeSlope) = getStake(amount, slope, cliff);
    }
}
