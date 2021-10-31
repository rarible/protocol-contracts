// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@rarible/lib-asset/contracts/LibAsset.sol";

/// @dev contract to add tokenToAuctionId functionality to auctionHouse
contract TokenToAuction {
    /// @dev mapping to store auction ids for token address + token id
    mapping(address => mapping(uint256 => uint256)) private tokenToAuctionId;

    /// @dev returns auction id by token address and token id
    function getAuctionByToken(address _collection, uint tokenId) public view returns(uint) {
        return tokenToAuctionId[_collection][tokenId];
    }

    /// @dev sets auction id for token address and token id
    function setAuctionForToken(LibAsset.Asset memory asset, uint auctionId) internal {
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
        tokenToAuctionId[token][tokenId] = auctionId;
    }

    /// @dev deletes auctionId from tokenToAuctionId
    function deleteAuctionForToken(LibAsset.Asset memory asset) internal {
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
        delete tokenToAuctionId[token][tokenId];
    }
    
    uint256[50] private ______gap;
}