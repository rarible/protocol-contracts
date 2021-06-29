#!/usr/bin/env bash
truffle test \
        ./test/Proxy.lazy.test.js \
        ./test/lazy-mint/ERC721LazyMintTest.sol \
        ./test/lazy-mint/ERC1155LazyMintTest.sol \
        "$@"