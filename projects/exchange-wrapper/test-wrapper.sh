#!/usr/bin/env bash
truffle test \
        ./test/ExchangeWrapper.test.js \
        ./contracts/test/TestERC721.sol \
        ./contracts/test/TestERC1155.sol \
        ./contracts/test/WrapperHelper.sol \
        ./contracts/test/RaribleTestHelper.sol \
        ./contracts/test/LooksRareTestHelper.sol \
        --compile-all
