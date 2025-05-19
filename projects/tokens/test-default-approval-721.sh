#!/usr/bin/env bash
truffle test ./test/erc-721-minimal/DefaultApproval.test.js \
            ./test/contracts/erc-721/ERC721DefaultApprovalTest.sol \
            ./test/contracts/TestERC1271.sol \
            --compile-all