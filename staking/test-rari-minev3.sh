#!/usr/bin/env bash
truffle test \
        ./test/RariMineV3.test.js \
        ./contracts/Staking.sol \
        ./contracts/RariMineV3.sol \
        ./test/contracts/LibSignatureTest.sol \
        ./contracts/IRariMine.sol\
        ./test/contracts/TestERC20.sol \
        ./test/contracts/TestNewStaking.sol \
        ./test/contracts/TestStaking.sol \
        ./test/contracts/TestNewStakingNoInteface.sol \
        ./test/contracts/LibEncoderTest.sol \
        --compile-all


truffle test ./test/RariMineV3.test.js ./contracts/Staking.sol ./contracts/RariMineV3.sol ./test/contracts/LibSignatureTest.sol ./contracts/IRariMine.sol ./test/contracts/TestERC20.sol ./test/contracts/TestNewStaking.sol ./test/contracts/TestStaking.sol ./test/contracts/TestNewStakingNoInteface.sol ./test/contracts/LibEncoderTest.sol --compile-all