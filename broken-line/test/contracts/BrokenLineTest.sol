// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/LibBrokenLine.sol";

contract BrokenLineTest is BrokenLineDomain {
    using LibBrokenLine for BrokenLine;
    event changeAmountResult(uint result);
    BrokenLine public brokenLine;

    function add(Line memory line, uint cliff) public {
        brokenLine.add(line, cliff);
    }

    function update(uint timeTo) public {
        brokenLine.update(timeTo);
    }

    function getCurrent() view public returns (Line memory) {
        return brokenLine.initial;
    }

    function changePeriodTest(BrokenLineDomain.Line memory oldLine, uint cliff, uint newSlope, uint toTime) public {
        return brokenLine.changeSlope(oldLine, cliff, newSlope, toTime);
    }

    function changeAmountTest(BrokenLineDomain.Line memory oldLine, uint cliff, uint newAmount, uint toTime) public {
        uint result = brokenLine.changeAmount(oldLine, cliff, newAmount, toTime);
        emit changeAmountResult(result);
    }
}
