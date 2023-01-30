// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../contracts/Locking.sol";

contract TestLocking is Locking {

    uint32 public blockNumberMocked;
    uint32 public epocShift;

    function incrementBlock (uint32 _amount) external {
        blockNumberMocked = blockNumberMocked + _amount;
    }

    function getBlockNumber() internal override view returns (uint32) {
        return blockNumberMocked;
    }

    function getLockTest(uint96 amount, uint32 slope, uint32 cliff) external view returns (uint96 lockAmount, uint96 lockSlope) {
        (lockAmount, lockSlope) = getLock(amount, slope, cliff);
    }

    function getEpochShift() internal view override returns (uint32) {
        return epocShift;
    }

    function setEpochShift(uint32 _epocShift) external {
        epocShift = _epocShift;
    }

    function setBlock(uint32 _block) external {
        blockNumberMocked = _block;
    }

    function blockTillNextPeriod() external view returns (uint){
        uint currentWeek = this.getWeek();
        return (WEEK * (currentWeek + 1)) + getEpochShift() - getBlockNumber();
    }
}
