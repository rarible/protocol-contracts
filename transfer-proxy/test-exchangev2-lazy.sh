#!/usr/bin/env bash
truffle test \
        ./test/ExchangeV2.lazy.test.js \
        ./test/tokens/TestERC20.sol \
        ./test/proxy/LibOrderTest.sol \
        ./test/proxy/ERC20TransferProxyTest.sol \
        ./test/proxy/TransferProxyTest.sol \
        ./test/proxy/ExchangeSimpleV2.sol \
        ./test/lazy-mint/ERC721LazyMintTest.sol \
        ./test/lazy-mint/ERC1155LazyMintTest.sol \
        "$@"