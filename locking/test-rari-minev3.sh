#!/usr/bin/env bash
truffle test \
        ./test/RariMineV3.test.js \
        ./contracts/Locking.sol \
        ./contracts/RariMineV3.sol \
        ./test/contracts/LibSignatureTest.sol \
        ./contracts/IRariMine.sol\
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TestNewLocking.sol \
        ./test/contracts/TestLocking.sol \
        ./test/contracts/TestNewLockingNoInteface.sol \
        ./test/contracts/LibEncoderTest.sol \
        --compile-all


# truffle test ./test/RariMineV3.test.js ./contracts/Locking.sol ./contracts/RariMineV3.sol ./test/contracts/LibSignatureTest.sol ./contracts/IRariMine.sol ./test/contracts/TestERC20.sol ./test/contracts/TestNewLocking.sol ./test/contracts/TestLocking.sol ./test/contracts/TestNewLockingNoInteface.sol ./test/contracts/LibEncoderTest.sol --compile-all