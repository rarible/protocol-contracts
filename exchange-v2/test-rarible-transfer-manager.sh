#!/usr/bin/env bash
#Test doTransfers in exchange-v2/contracts/exchange/v2/RaribleTransferManager.sol
truffle test \
            ./test/v2/RaribleManager.test.js \
            ./test/contracts/tokens/TestERC20.sol \
            ./test/contracts/tokens/TestERC721.sol \
            ./test/contracts/tokens/TestERC1155.sol \
            ./test/contracts/v2/RaribleTransferManagerTest.sol \
            ./test/contracts/v2/LibOrderTest.sol \
            ./test/contracts/v2/TestRoyaltiesRegistry.sol \
            ./test/contracts/v2/ERC20TransferProxyTest.sol \
            ./test/contracts/v2/TransferProxyTest.sol \
            ./test/contracts/v2/ERC721LazyMintTest.sol \
            ./test/contracts/v2/ERC1155LazyMintTest.sol \
            ./test/contracts/v2/ERC721LazyMintTransferProxyTest.sol \
            ./test/contracts/v2/ERC1155LazyMintTransferProxyTest.sol \
            ./test/contracts/v2/PunkTransferProxyTest.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltiesV1.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltiesV2.sol \
            ./test/contracts/tokens/TestERC1155WithRoyaltiesV1.sol \
            ./test/contracts/tokens/TestERC1155WithRoyaltiesV2.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltiesV1_InterfaceError.sol \
            ./test/contracts/tokens/TestERC1155WithRoyaltiesV2_InterfaceError.sol \
            ./test/contracts/tokens/TestERC721WithRoyaltyV2981.sol \
            --compile-all



