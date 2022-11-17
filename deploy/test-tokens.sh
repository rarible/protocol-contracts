#!/usr/bin/env bash
truffle test ./test/tokens/tokens_factories.test.js \
            ./test/tokens/tokens_meta.test.js \
            ./test/exchange/contracts/RaribleTestHelper.sol \
            --compile-all
