#!/usr/bin/env bash
truffle test \
        ./test/TransferExecutor.test.js \
        ./test/proxy/TransferExecutorTest.sol \
        ./test/tokens/TestERC20.sol \
        ./test/tokens/TestERC721.sol \
        ./test/tokens/TestERC1155.sol