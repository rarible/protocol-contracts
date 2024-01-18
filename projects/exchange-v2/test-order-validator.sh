#!/usr/bin/env bash
truffle test ./test/OrderValidator.test.js \
            ./test/contracts/OrderValidatorTest.sol \
            ./test/contracts/TestERC1271.sol \
            --compile-all