#!/usr/bin/env bash
truffle test ./test/exchange/ExchangeV2.test.js \
            ./test/exchange/ExchangeV2Meta.test.js \
            ./test/exchange/contracts/RaribleTestHelper.sol \
            ./test/contracts/TestERC721RoyaltiesV1.sol \
            ./test/contracts/TestERC721RoyaltiesV2.sol \
            ./test/contracts/TestERC1155RoyaltiesV2.sol \
            ./test/contracts/TestERC20.sol \
            ./test/contracts/ERC721LazyMintTest.sol \
            --compile-all
