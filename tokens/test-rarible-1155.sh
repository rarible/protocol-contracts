#!/usr/bin/env bash
truffle test ./test/erc-1155/ERC1155Rarible.test.js \
              ./contracts/erc-1155/ERC1155RaribleFactory.sol \
              ./test/contracts/transfer-proxy/TransferProxyTest.sol \
              ./test/contracts/transfer-proxy/ERC1155LazyMintTransferProxyTest.sol \
              ./test/contracts/TestERC1271.sol