#!/usr/bin/env bash
truffle test ./test/erc-721/ERC721Factories.test.js \
              ./contracts/create-2/ERC721RaribleUserFactoryC2.sol \
              ./contracts/erc-721/ERC721RaribleUser.sol \
              ./contracts/create-2/ERC721RaribleFactoryC2.sol \
              ./contracts/erc-721/ERC721Rarible.sol \
