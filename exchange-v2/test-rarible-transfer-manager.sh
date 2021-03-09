#!/usr/bin/env bash
#Test doTransfers in exchange-v2/contracts/exchange/v2/RaribleTransferManager.sol
truffle test \
            ./test/v2/RaribleManager.test.js \
            ./test/contracts/tokens/TestERC20.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC1155.sol \
            ./test/contracts/v2/RaribleTransferManagerTest.sol \
            ./test/contracts/v2/LibOrderTest.sol

