// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import {AuctionHouse721} from "@rarible/auction/contracts/721/AuctionHouse721.sol";

contract FaultyBidder {

    function faultyBid(address _auction, uint _auctionId, AuctionHouse721.Bid memory bid) external payable {
        AuctionHouse721(_auction).putBid{value: msg.value}(_auctionId, bid);
    }

    function withdrawFaultyBid(address _auction, address _to) external {
        AuctionHouse721(_auction).withdrawFaultyBid(_to);
    }

    receive() external payable {
        revert("no eth pls");
    }
}
