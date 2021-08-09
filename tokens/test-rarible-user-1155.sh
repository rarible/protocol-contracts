#!/usr/bin/env bash
truffle test ./test/erc-1155/ERC1155RaribleUser.test.js \
              ./contracts/erc-1155/ERC1155RaribleUserFactory.sol \
              ./test/contracts/TestERC1271.sol