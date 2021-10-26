// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/AuctionHouse.sol";

contract TestAuctionHouse is AuctionHouse {
    function setTimeRangeTest(uint _startTime, uint _endTime, uint _duration) external returns (uint, uint) {
        return setTimeRange(_startTime, _endTime, _duration);
    }

    function timeNow() external view returns(uint) {
        return block.timestamp;
    }

    function encode(LibAucDataV1.DataV1 memory data) pure public returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeBid(LibBidDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }
}
