// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@rarible/lib-asset/contracts/LibAsset.sol";

contract TokenToAuction {
    mapping(address => mapping(uint256 => uint256)) private tokenToAuctionId;

    function getAuctionByToken(address _collection, uint tokenId) public view returns(uint) {
        return tokenToAuctionId[_collection][tokenId];
    }

    function setAuctionForToken(LibAsset.Asset memory asset, uint auctionId) internal {
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
        tokenToAuctionId[token][tokenId] = auctionId;
    }

    function deleteAuctionForToken(LibAsset.Asset memory asset) internal {
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
        delete tokenToAuctionId[token][tokenId];
    }
    
    uint256[50] private ______gap;
}