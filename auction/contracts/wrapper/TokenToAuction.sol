// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

/// @dev contract to add tokenToAuctionId functionality to auctionHouse
contract TokenToAuction {
    /// @dev mapping to store auction ids for token address + token id (only stores erc-721 tokens)
    mapping(address => mapping(uint256 => uint256)) private tokenToAuctionId;

    /// @dev returns auction id by token address and token id
    function getAuctionByToken(address _collection, uint tokenId) public view returns(uint) {
        return tokenToAuctionId[_collection][tokenId];
    }

    /// @dev sets auction id for token address and token id
    function setAuctionForToken(address token, uint tokenId, uint auctionId) internal {
        tokenToAuctionId[token][tokenId] = auctionId;
    }

    /// @dev deletes auctionId from tokenToAuctionId
    function deleteAuctionForToken(address token, uint tokenId) internal {
        delete tokenToAuctionId[token][tokenId];
    }
    
    uint256[50] private ______gap;
}