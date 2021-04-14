#!/usr/bin/env bash
#Test metods in royalties-registry/contracts/RoyaltiesRegistry.sol
truffle test \
            ./test/contracts/RoyaltiesRegistrySimple.test.js \
            ./test/contracts/royalty-registry/RoyaltiesProviderTest.sol \
            ./test/contracts/royalty-registry/RoyaltiesRegistryTest.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol




