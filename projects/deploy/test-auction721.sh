#!/usr/bin/env bash
truffle test ./test/auction/AuctionHouse721.test.js \
            ./test/auction/contracts/AuctionTestHelper.sol \
            ./test/auction/contracts/FaultyBidder.sol \
            ./test/auction/contracts/PartyBidTest.sol \
            ./test/contracts/TestERC721.sol \
            ./test/contracts/TestERC20.sol \
            --compile-all
