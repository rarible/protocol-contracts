#!/usr/bin/env bash
truffle test \
        ./test/TransferExecutor.test.js \
        ./test/proxy/TransferExecutorTest.sol \
        ./test/proxy/TestERC20.sol \
        ./test/proxy/TestERC721.sol \
        ./test/proxy/TestERC1155.sol