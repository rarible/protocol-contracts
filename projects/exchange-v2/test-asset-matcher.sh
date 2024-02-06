#!/usr/bin/env bash
truffle test ./test/AssetMatcher.test.js \
              ./test/contracts/AssetMatcherTest.sol \
              ./test/contracts/TestAssetMatcher.sol \
              --compile-all