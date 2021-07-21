#!/usr/bin/env bash
truffle test ./test/erc-721/ERC721Upgrade.test.js \
              ./contracts/erc-721/ERC721RaribleUserFactory.sol \
              ./contracts/erc-721/ERC721RaribleUser.sol
