#!/usr/bin/env bash
#Test metods in royalties-registry/contracts/RoyaltiesRegistry.sol
truffle test \
            ./test/v2/RoyaltiesRegistry.test.js \
            ./test/contracts/v2/RaribleTransferManagerTest.sol \
            ./test/contracts/v2/RoyaltiesProviderTest.sol \
            ./test/contracts/tokens/TestERC20.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC1155.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol



