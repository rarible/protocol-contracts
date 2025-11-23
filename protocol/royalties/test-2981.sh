#!/usr/bin/env bash
truffle test ./test/ierc2981.test.js \
              ./test/contracts/Royalties2981Test.sol \
              --compile-all