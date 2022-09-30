#!/usr/bin/env bash
truffle test \
        ./test/RariMineV3.test.js \
        ./contracts/Staking.sol \
        ./test/contracts/TestERC20.sol \
        ./test/contracts/RariMineV3.sol \
        ./test/contracts/IRariMine.sol \
        ./test/contracts/TestStaking.sol \


truffle test ./test/RariMineV3.test.js ./contracts/Staking.sol ./test/contracts/TestERC20.sol ./contracts/RariMineV3.sol ./contracts/IRariMine.sol ./test/contracts/TestStaking.sol ./test/contracts/LibSignatureTest.sol ./test/contracts/LibEncoderTest.sol
