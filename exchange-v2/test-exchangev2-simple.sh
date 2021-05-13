#!/usr/bin/env bash
truffle test \
        ./test/v2/ExchangeV2.simple.test.js \
        ./test/contracts/tokens/TestERC20.sol \
        ./test/contracts/v2/ERC20TransferProxyTest.sol \
        ./test/contracts/v2/ExchangeSimpleV2_1.sol \
        ./test/contracts/v2/TransferProxyTest.sol \
        ./test/contracts/v2/TestRoyaltiesRegistry.sol \
        ./test/contracts/v2/LibOrderTest.sol \
        --compile-all