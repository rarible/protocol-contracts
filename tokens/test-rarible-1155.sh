#!/usr/bin/env bash
truffle test ./test/erc-1155/ERC1155Rarible.test.js \
              ./contracts/create-2/ERC1155RaribleFactoryC2.sol \
              ./test/contracts/transfer-proxy/TransferProxyTest.sol \
              ./test/contracts/transfer-proxy/ERC1155LazyMintTransferProxyTest.sol \
              ./test/contracts/TestERC1271.sol \
              --compile-all