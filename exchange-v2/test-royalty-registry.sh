#!/usr/bin/env bash
#Test metods in exchange-v2/contracts/exchange/v2/RoyaltiesRegistry.sol
truffle test \
            ./contracts/royalties-registry/RoyaltiesRegistry.test.js \
            ./test/contracts/v2/RaribleTransferManagerTest.sol \
            ./test/contracts/v2/RoyaltiesProviderTest.sol \
            ./test/contracts/tokens/TestERC20.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC1155.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol



