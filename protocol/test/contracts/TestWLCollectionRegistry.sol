// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

contract TestWLCollectionRegistry  {
    struct Collection {
        address creator;
        address collection;
    }

    // Mapping from chainId to collection address to Collection struct
    mapping(uint256 => mapping(address => Collection)) public collections;

    event CollectionAdded(address indexed collection, address indexed creator, uint256 chainId);
    event CollectionRemoved(address indexed collection, address indexed creator, uint256 chainId);

    constructor() {
    }

    function addToWL(address collection, address creator, uint256 chainId) external {
        require(collection != address(0), "Invalid collection address");
        require(collections[chainId][collection].creator == address(0), "Collection already whitelisted on this chain");
        require(chainId != 0, "Invalid chainId");

        collections[chainId][collection] = Collection({
            creator: creator,
            collection: collection
        });

        emit CollectionAdded(collection, creator, chainId);
    }

    function removeFromWL(address collection, uint256 chainId) external {
        require(collections[chainId][collection].creator != address(0), "Collection not whitelisted on this chain");
        Collection memory col = collections[chainId][collection];

        delete collections[chainId][collection];
        emit CollectionRemoved(collection, col.creator, chainId);
    }
}