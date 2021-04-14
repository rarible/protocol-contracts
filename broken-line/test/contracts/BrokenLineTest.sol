pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../../contracts/staking/v2/BrokenLine.sol";

contract BrokenLineTest is BrokenLineDomain {
    using BrokenLineLibrary for BrokenLine;

    BrokenLine public brokenLine;

    function add(Line memory line) public {
        brokenLine.add(line);
    }

    function update(uint timeTo) public {
        brokenLine.update(timeTo);
    }

    function getCurrent() view public returns (Line memory) {
        return brokenLine.initial;
    }
}
