#!/usr/bin/env bash
truffle test ./test/RoyaltiesTypes.test.js \
              ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol \
              ./test/contracts/tokens/TestERC721WithRoyaltyV2OwnableUpgradeable.sol \
              ./test/contracts/tokens/TestERC721WithRoyaltyV2981.sol \
              ./test/contracts/tokens/TestERC721.sol \
              ./test/contracts/royalty-registry/RoyaltiesProviderTest.sol \
              ./test/contracts/royalty-registry/RoyaltiesRegistryOld.sol \
              --compile-all