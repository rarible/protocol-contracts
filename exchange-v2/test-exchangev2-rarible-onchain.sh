#!/usr/bin/env bash
truffle test \
        ./test/v2/OnchainOrderBook.test.js \
        ./test/contracts/tokens/TestERC20.sol \
        ./test/contracts/tokens/TestERC721.sol \
        ./test/contracts/tokens/TestERC1155.sol \
        ./test/contracts/tokens/TestERC1155WithRoyaltiesV2.sol \
        ./test/contracts/tokens/TestERC721WithRoyaltiesV1.sol \
        ./test/contracts/v2/LibOrderTest.sol \
        ./test/contracts/v2/ERC20TransferProxyTest.sol \
        ./test/contracts/v2/TransferProxyTest.sol \
        ./test/contracts/v2/RaribleTransferManagerTest.sol \
        ./test/contracts/v2/TestRoyaltiesRegistry.sol \
        ./test/contracts/tokens/TestERC721WithRoyaltyV1OwnableUpgradeable.sol \
        --compile-all
