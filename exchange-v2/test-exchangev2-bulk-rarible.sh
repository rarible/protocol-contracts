#!/usr/bin/env bash
truffle test \
        ./test/v2/ExchangeBulkV2.rarible.test.js \
        ./test/contracts/tokens/TestERC20.sol \
        ./test/contracts/tokens/TestERC721.sol \
        ./test/contracts/tokens/TestERC1155.sol \
        ./test/contracts/v2/ERC20TransferProxyTest.sol \
        ./test/contracts/v2/TransferProxyTest.sol \
        ./test/contracts/v2/TestRoyaltiesRegistry.sol \
        --compile-all
