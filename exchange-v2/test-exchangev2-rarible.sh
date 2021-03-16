#!/usr/bin/env bash
truffle test \
        ./test/v2/ExchangeV2.rarible.test.js \
        ./test/contracts/tokens/TestERC20.sol \
        ./test/contracts/v2/LibOrderTest.sol \
        ./test/contracts/v2/RaribleTransferManagerTest.sol
