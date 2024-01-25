// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../AuctionHouseBase.sol";

abstract contract AuctionHouseBase1155 is AuctionHouseBase  {

    /// @dev mapping to store data of auctions for auctionId
    mapping(uint => Auction) auctions;

    /// @dev auction struct
    struct Auction {
        // asset that is being sold at auction
        address sellToken;
        uint96 sellTokenValue;
        uint sellTokenId;
        // asset type that bids are taken in
        address buyAsset;
        // the time when auction ends
        uint96 endTime;
        // information about the current highest bid
        Bid lastBid;
        // seller address
        address payable seller;
        // the minimal amount of the first bid
        uint96 minimalPrice;
        // buyer address
        address payable buyer;
        // protocolFee at the time of the purchase
        uint64 protocolFee;
        // version of Auction to correctly decode data field
        bytes4 dataType;
        // field to store additional information for Auction, can be seen in "LibAucDataV1.sol"
        bytes data;
    }

}