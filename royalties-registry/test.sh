#!/usr/bin/env bash
truffle test ./test/RoyaltiesRegistry.test.js \
            ./test/contracts/royalty-registry/RoyaltiesRegistryTest.sol \
            ./test/contracts/royalty-registry/RoyaltiesProviderTest.sol \
            ./test/contracts/royalty-registry/TestERC721ArtBlocks.sol \
            ./test/contracts/royalty-registry/TestERC721ArtBlocks.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV2OwnableUpgradeable.sol \
            ./test/contracts/tokens/TestERC721RoyaltyV2Legacy.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV2981.sol \
