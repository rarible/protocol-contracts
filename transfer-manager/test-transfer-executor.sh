#!/usr/bin/env bash
truffle test \
        ./test/TransferExecutor.test.js \
        ./test/contracts/TransferExecutorTest.sol \
        ./test/contracts/TransferProxyTest.sol \
        ./test/contracts/ERC20TransferProxyTest.sol \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TestERC721.sol \
        ./test/contracts/TestERC1155.sol