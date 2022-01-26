#!/usr/bin/env bash
truffle test ./test/MetaTransaction.test.js \
          ./test/contracts/MetaTxTest.sol \
          ./test/contracts/MetaTxSaltTest.sol \
          ./test/contracts/NoMetaTxTest.sol \
          ./test/contracts/NoGetNonceTxTest.sol
