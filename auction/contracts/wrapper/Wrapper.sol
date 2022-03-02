// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "./IMarketWrapper.sol";
import "../721/AuctionHouse721.sol";

contract Wrapper is IMarketWrapper{

    AuctionHouse721 internal immutable auction;

    constructor(address _auction) {
        auction = AuctionHouse721(_auction);
    }

    function auctionIdMatchesToken(
        uint256 auctionId,
        address nftContract,
        uint256 tokenId
    ) external override view returns (bool){
        return auctionId == auction. getAuctionByToken(nftContract, tokenId);
    }

    function getMinimumBid(uint256 auctionId) external override view returns (uint256){
        return auction.getMinimalNextBid(auctionId);
    }

    function getCurrentHighestBidder(uint256 auctionId)
        external
        override
        view
        returns (address){
            return auction.getCurrentBuyer(auctionId);
        }

    function bid(uint256 auctionId, uint256 bidAmount) external override{
        (bool success, bytes memory returnData) =
            address(auction).call{value: bidAmount}(
                abi.encodeWithSignature("putBidWrapper(uint256)", auctionId)
            );
        require(success, string(returnData));
    }

    function isFinalized(uint256 auctionId) external override view returns (bool){
        return !auction.checkAuctionExistence(auctionId);
    }

    function finalize(uint256 auctionId) external override{
        auction.finishAuction(auctionId);
    }
}