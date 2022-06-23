#!/usr/bin/env bash
truffle test ./test/auction/AuctionHouse1155.test.js \
            ./test/auction/contracts/AuctionTestHelper.sol \
            ./test/auction/contracts/FaultyBidder.sol \
            ./test/contracts/TestERC1155.sol \
            ./test/contracts/TestERC20.sol \
            --compile-all
