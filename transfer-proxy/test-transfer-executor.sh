#!/usr/bin/env bash
truffle test \
        ./test/TransferExecutor.test.js \
        ./test/TransferExecutorTest.sol \
        ./test/TestERC20.sol \
        ./test/TestERC721.sol \
        ./test/TestERC1155.sol