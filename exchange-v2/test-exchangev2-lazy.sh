#!/usr/bin/env bash
truffle test \
        ./test/lazy-mint/ExchangeV2.lazy.test.js \
         ./test/contracts/tokens/TestERC20.sol \
         ./test/contracts/v2/LibOrderTest.sol \
         ./test/contracts/lazy-mint/ERC721LazyMintTest.sol \
         ./test/contracts/lazy-mint/ERC1155LazyMintTest.sol