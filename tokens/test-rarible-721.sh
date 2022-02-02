#!/usr/bin/env bash
truffle test ./test/erc-721/Rarible.test.js \
              ./contracts/create-2/ERC721RaribleFactoryC2.sol \
              ./test/contracts/transfer-proxy/TransferProxyTest.sol \
              ./test/contracts/transfer-proxy/ERC721LazyMintTransferProxyTest.sol \
              ./test/contracts/TestERC1271.sol \
              ./test/contracts/TestRoyaltyV2981Calculate.sol \
              --compile-all
              