// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/LibBrokenLine.sol";

contract BrokenLineTest {
    LibBrokenLine.BrokenLine public brokenLineTestLocal;
    event resultRemoveLine(uint result);

    function addTest(LibBrokenLine.Line memory line, uint id, uint cliff) public {
        LibBrokenLine.add(brokenLineTestLocal, id, line, cliff);
    }

    function update(uint timeTo) public {
        LibBrokenLine.update(brokenLineTestLocal, timeTo);
    }

    function getCurrent() view public returns (LibBrokenLine.Line memory) {
        return brokenLineTestLocal.initial;
    }

    function removeTest(uint id, uint toTime) public {
        uint result = LibBrokenLine.remove(brokenLineTestLocal, id, toTime);
        emit resultRemoveLine(result);
    }
}
