#!/usr/bin/env bash
truffle test ./test/v2/OrderValidator.test.js \
            ./test/contracts/v2/OrderValidatorTest.sol \
            ./test/contracts/tokens/TestERC1271.sol \
            ./test/contracts/tokens/TestERC20.sol