#!/usr/bin/env bash
#Test doTransfers in exchange-contracts/exchange/RaribleTransferManager.sol
truffle test \
            ./test/RaribleManager.test.js \
            ./test/contracts/RaribleTransferManagerTest.sol \
            ./test/contracts/TransferProxyTest.sol \
            ./test/contracts/TestRoyaltiesRegistry.sol \
            ./test/contracts/ERC20TransferProxyTest.sol \
            ./test/contracts/TestERC20.sol \
            ./test/contracts/TestERC721RoyaltiesV1.sol \
            ./test/contracts/TestERC721RoyaltiesV2.sol \
            ./test/contracts/TestERC1155RoyaltiesV2.sol \
            ./test/contracts/TestERC1155RoyaltiesV1.sol \
            ./test/contracts/TestERC721WithRoyaltiesV1_InterfaceError.sol \
            ./test/contracts/TestERC1155WithRoyaltiesV2_InterfaceError.sol \
            ./test/contracts/ERC721LazyMintTest.sol \
            ./test/contracts/ERC1155LazyMintTest.sol \
            ./test/contracts/ERC721LazyMintTransferProxyTest.sol \
            ./test/contracts/ERC1155LazyMintTransferProxyTest.sol \
            --compile-all



