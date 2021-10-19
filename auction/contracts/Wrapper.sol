// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "./IMarketWrapper.sol";

contract Wrapper is IMarketWrapper{

    function auctionIdMatchesToken(
        uint256 auctionId,
        address nftContract,
        uint256 tokenId
    ) external override view returns (bool){

    }

    function getMinimumBid(uint256 auctionId) external override view returns (uint256){

    }

    function getCurrentHighestBidder(uint256 auctionId)
        external
        override
        view
        returns (address){

        }

    function bid(uint256 auctionId, uint256 bidAmount) external override{

    }

    function isFinalized(uint256 auctionId) external override view returns (bool){

    }

    function finalize(uint256 auctionId) external override{

    }
}