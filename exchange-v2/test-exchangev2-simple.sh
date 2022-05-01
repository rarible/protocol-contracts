#!/usr/bin/env bash
truffle test \
        ./test/ExchangeV2.simple.test.js \
        ./test/contracts/ExchangeSimpleV2.sol \
        ./test/contracts/ExchangeSimpleV2_1.sol \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TransferProxyTest.sol \
        ./test/contracts/ERC20TransferProxyTest.sol \
        ./test/contracts/LibOrderTest.sol \
        --compile-all