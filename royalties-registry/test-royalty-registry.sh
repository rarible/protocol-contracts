#!/usr/bin/env bash
#Test metods in royalties-registry/contracts/RoyaltiesRegistry.sol
truffle test \
            ./test/contracts/RoyaltiesRegistry.test.js \
            ./test/contracts/transfer/RaribleTransferManagerTest.sol \
            ./test/contracts/royalty-registry/RoyaltiesProviderTest.sol \
            ./test/contracts/transfer/TransferProxyTest.sol \
            ./test/contracts/transfer/ERC20TransferProxyTest.sol \
            ./test/contracts/tokens/TestERC20.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC1155.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol



