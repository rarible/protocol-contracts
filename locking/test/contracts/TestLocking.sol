// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../contracts/Locking.sol";

contract TestLocking is Locking {

    uint public blockNumberMocked;
    uint public epocShift;

    function incrementBlock (uint _amount) external {
        blockNumberMocked = blockNumberMocked + _amount;
    }

    function getBlockNumber() internal override view returns (uint) {
        return blockNumberMocked;
    }

    function getLockTest(uint amount, uint slope, uint cliff) external view returns (uint lockAmount, uint lockSlope) {
        (lockAmount, lockSlope) = getLock(amount, slope, cliff);
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
        return (WEEK * (currentWeek + 1)) + getEpochShift() - getBlockNumber();
    }
}
