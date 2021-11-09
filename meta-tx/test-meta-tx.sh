#!/usr/bin/env bash
truffle test ./test/MetaTransaction.test.js \
          ./test/contracts/MetaTxTest.sol \
          ./test/contracts/NoMetaTxTest.sol
