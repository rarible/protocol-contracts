// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../contracts/Staking.sol";

contract TestStaking is Staking {

    uint public blockNumberMocked;
    uint public epocShift;

    function incrementBlock (uint _amount) external {
        blockNumberMocked = blockNumberMocked + _amount;
    }

    function getBlockNumber() internal override view returns (uint) {
        return blockNumberMocked;
    }

    function getStakeTest(uint amount, uint slope, uint cliff) external view returns (uint stakeAmount, uint stakeSlope) {
        (stakeAmount, stakeSlope) = getStake(amount, slope, cliff);
    }

    function getEpochShift() internal view override returns (uint) {
        return epocShift;
    }

    function setEpochShift(uint _epocShift) external {
        epocShift = _epocShift;
    }

    function setBlock(uint _block) external {
        blockNumberMocked = _block;
    }

    function blockTillNextPeriod() external view returns (uint){
        uint currentWeek = this.getWeek();
        //return (WEEK * (currentWeek + 1)) - getBlockNumber();
        return (WEEK * (currentWeek + 1)) + getEpochShift() - getBlockNumber();
    }
}
//15680546
//15674400 
