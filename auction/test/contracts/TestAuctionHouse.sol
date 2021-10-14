// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/AuctionHouse.sol";

contract TestAuctionHouse is AuctionHouse {
    function setTimeRangeTest(uint _startTime, uint _endTime, uint _duration) external returns (uint, uint) {
        return setTimeRange(_startTime, _endTime, _duration);
    }
}
