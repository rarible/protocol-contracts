#!/usr/bin/env bash
truffle test ./test/RoyaltiesRegistry.test.js \
            ./test/contracts/tokens/TestERC721WithRoyaltyV2981.sol \
            ./test/contracts/royalty-registry/RoyaltiesRegistryTest.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/royalty-registry/RoyaltiesProviderTest.sol