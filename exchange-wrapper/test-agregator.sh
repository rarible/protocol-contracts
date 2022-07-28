#!/usr/bin/env bash
truffle test \
        ./test/ExchangeAgregator.test.js \
        ./test/contracts/TestERC721.sol \
        ./test/contracts/TestERC1155.sol \
        ./test/contracts/WrapperHelper.sol \
        ./test/exchange/contracts/LooksRareTestHelper.sol \
        --compile-all
