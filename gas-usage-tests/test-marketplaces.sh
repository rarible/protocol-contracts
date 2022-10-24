#!/usr/bin/env bash
truffle test \
        ./test/marketplaces.test.js \
        ./test/contracts/RaribleTestHelper.sol \
        ./test/contracts/X2Y2TestHelper.sol \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TestERC1155.sol \
        ./test/contracts/TestERC721.sol \
        --compile-all