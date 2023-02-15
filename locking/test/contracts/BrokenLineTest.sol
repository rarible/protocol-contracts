// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/libs/LibBrokenLine.sol";

contract BrokenLineTest {
    LibBrokenLine.BrokenLine public brokenLineTestLocal;
    event resultRemoveLine(uint bias, uint slope, uint cliff);

    uint32 constant WEEK = 10;

    struct LineOld {
        uint32 start;
        uint96 bias;
        uint96 slope;
    }

    function addTestWithBlock(LineOld memory lineOld, uint id, uint32 cliff, uint32 currentBlock) public {
        LibBrokenLine.Line memory line;
        line.start = lineOld.start;
        line.bias = lineOld.bias;
        line.slope = lineOld.slope;
        line.cliff = cliff;
        LibBrokenLine.addOneLine(brokenLineTestLocal, id, line, currentBlock);
    }

    function addTest(LineOld memory lineOld, uint id, uint32 cliff) public {
        LibBrokenLine.Line memory line;
        line.start = lineOld.start;
        line.bias = lineOld.bias;
        line.slope = lineOld.slope;
        line.cliff = cliff;
        LibBrokenLine.addOneLine(brokenLineTestLocal, id, line, line.start * WEEK);
    }

    function update(uint32 timeTo) public {
        LibBrokenLine.update(brokenLineTestLocal, timeTo);
    }

    function getCurrent() view public returns (LibBrokenLine.Line memory) {
        return brokenLineTestLocal.initial;
    }

    function getActualValueWithBlock(uint32 timeTo, uint32 currentBlock) external returns (uint bias) {
        return LibBrokenLine.actualValue(brokenLineTestLocal, timeTo, currentBlock);
    }

    function getActualValue(uint32 timeTo) external returns (uint bias) {
        return LibBrokenLine.actualValue(brokenLineTestLocal, timeTo, timeTo * WEEK);
    }
    
    function removeTestWithBlock(uint id, uint32 toTime, uint32 currentBlock) public {
        (uint bias, uint slope, uint cliff) = LibBrokenLine.remove(brokenLineTestLocal, id, toTime, currentBlock);
        emit resultRemoveLine(bias, slope, cliff);
    }

    function removeTest(uint id, uint32 toTime) public {
        (uint bias, uint slope, uint cliff) = LibBrokenLine.remove(brokenLineTestLocal, id, toTime, toTime * WEEK);
        emit resultRemoveLine(bias, slope, cliff);
    }

    function getSlopeChanges(uint time) external view returns (int96) {
        return brokenLineTestLocal.slopeChanges[time];
    }

    function getSnapshots(uint index) external view returns(LibBrokenLine.Point memory) {
        return brokenLineTestLocal.history[index];
    }

    function getSnapshotsLength() external view returns(uint) {
        return brokenLineTestLocal.history.length;
    }
}
