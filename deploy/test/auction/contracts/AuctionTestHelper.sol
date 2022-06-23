// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import {LibAucDataV1} from "@rarible/auction/contracts/721/AuctionHouse721.sol";
import {LibBidDataV1} from "@rarible/auction/contracts/721/AuctionHouse721.sol";
import {AuctionHouseBase} from "@rarible/auction/contracts/721/AuctionHouse721.sol";
import {AuctionHouse721} from "@rarible/auction/contracts/721/AuctionHouse721.sol";

contract AuctionTestHelper {

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

    function encodeOriginFeeIntoUint(address account, uint96 value) external pure returns(uint){
        return (uint(value) << 160) + uint(account);
    }

    function putBidTime(address auction, uint _auctionId, AuctionHouseBase.Bid memory bid) payable public {
      AuctionHouse721(auction).putBid{value: msg.value}(_auctionId, bid);
      emit timeStamp(block.timestamp);
    }
}
