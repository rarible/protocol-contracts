#!/usr/bin/env bash
truffle test ./test/erc-721/Rarible.test.js \
              ./contracts/erc-721/ERC721RaribleFactory.sol \
              ./test/contracts/TestERC1271.sol