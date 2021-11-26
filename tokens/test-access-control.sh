#!/usr/bin/env bash
truffle test ./test/erc-721-minimal/RaribleUser.test.js \
             ./test/erc-1155/ERC1155RaribleUser.test.js \
             ./test/MinterAccessControl.test.js \
             ./test/contracts/access/MinterAccessControlTest.sol