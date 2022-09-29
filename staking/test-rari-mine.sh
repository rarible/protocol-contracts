#!/usr/bin/env bash
truffle test \
        ./test/RariMine.test.js \
        ./contracts/Staking.sol \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/RariMine.sol \
        ./test/contracts/TestStaking.sol \
