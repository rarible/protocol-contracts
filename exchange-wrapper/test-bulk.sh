#!/usr/bin/env bash
truffle test \
        ./test/bulk.test.js \
        ./test/contracts/TestERC721.sol \
        ./test/contracts/TestERC1155.sol \
        ./test/contracts/WrapperHelper.sol \
        ./test/contracts/RaribleTestHelper.sol \
        ./test/contracts/LooksRareTestHelper.sol \
        --compile-all
