#!/usr/bin/env bash
truffle test \
        ./test/Locking.test.js \
        ./contracts/Locking.sol \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TestNewLocking.sol \
        ./test/contracts/TestLocking.sol \
        ./test/contracts/TestNewLockingNoInteface.sol \
        --compile-all
