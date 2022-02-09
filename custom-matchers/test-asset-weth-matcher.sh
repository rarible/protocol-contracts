#!/usr/bin/env bash
truffle test ./test/AssetWETHMatcher.test.js \
              ./test/contracts/tokens/WETHTest.sol
            --compile-all