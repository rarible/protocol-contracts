#!/usr/bin/env bash
truffle test \
        ./test/wrapper/ExchangeWrapper.test.js \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TestERC721.sol \
        ./test/contracts/TestERC1155.sol \
        ./test/contracts/WrapperHelper.sol \
        ./test/exchange/contracts/RaribleTestHelper.sol \
        --compile-all
