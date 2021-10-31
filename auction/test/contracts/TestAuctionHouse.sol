// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/AuctionHouse.sol";

contract TestAuctionHouse is AuctionHouse {

    event timeStamp(uint time);
    function timeNow() external view returns(uint) {
        return block.timestamp;
    }

    function encode(LibAucDataV1.DataV1 memory data) pure public returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeBid(LibBidDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }
    
    function putBidTime(uint _auctionId, Bid memory bid) payable public {
      putBid(_auctionId, bid);
      emit timeStamp(block.timestamp);
    }

    function getAuction(uint _auctionId) public view returns(Auction memory){
      return auctions[_auctionId];
    }
}
