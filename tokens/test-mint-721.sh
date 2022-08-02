#!/usr/bin/env bash
truffle test ./test/erc-721-minimal/Mint721Validator.test.js \
            ./test/contracts/erc-721/Mint721ValidatorTest.sol \
            ./test/contracts/TestERC1271.sol 