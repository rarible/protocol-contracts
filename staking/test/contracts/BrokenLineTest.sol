// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/libs/LibBrokenLine.sol";

contract BrokenLineTest {
    LibBrokenLine.BrokenLine public brokenLineTestLocal;
    event resultRemoveLine(uint bias, uint slope, uint cliff);

    function addTest(LibBrokenLine.Line memory line, uint id, uint cliff) public {
        LibBrokenLine.add(brokenLineTestLocal, id, line, cliff);
    }

    function update(uint timeTo) public {
        LibBrokenLine.update(brokenLineTestLocal, timeTo);
    }

    function getCurrent() view public returns (LibBrokenLine.Line memory) {
        return brokenLineTestLocal.initial;
    }

    function getActualValue(uint timeTo) external returns (uint bias) {
        return LibBrokenLine.actualValue(brokenLineTestLocal, timeTo);
    }

    function removeTest(uint id, uint toTime) public {
        (uint bias, uint slope, uint cliff) = LibBrokenLine.remove(brokenLineTestLocal, id, toTime);
        emit resultRemoveLine(bias, slope, cliff);
    }
}
