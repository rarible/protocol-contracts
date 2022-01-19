// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/AuctionHouse.sol";

contract FaultyBidder {

    function faultyBid(address _auction, uint _auctionId, AuctionHouse.Bid memory bid) external payable {
        AuctionHouse(_auction).putBid{value: msg.value}(_auctionId, bid);
    }

    function withdrawFaultyBid(address _auction, address _to) external {
        AuctionHouse(_auction).withdrawFaultyBid(_to);
    }

    receive() external payable {
        revert("no eth pls");
    }
}
