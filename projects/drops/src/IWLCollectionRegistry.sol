// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWLCollectionRegistry {
    function addToWL(address collection, address creator, uint256 chainId) external;
    function removeFromWL(address collection) external;
    function getCollection(address collection) external view returns (address creator, uint256 chainId);
}