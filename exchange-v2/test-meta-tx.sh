#!/usr/bin/env bash
truffle test ./test/v2/EIP712MetaTransaction.test.js \
          ./test/contracts/v2/TransferProxyTest.sol \
          ./test/contracts/tokens/TestERC20.sol \
          ./test/contracts/v2/TestRoyaltiesRegistryNew.sol \
          ./test/contracts/v2/ExchangeSimpleV2_MetaTx.sol \
          ./test/contracts/v2/ExchangeSimpleV2.sol \
          ./test/contracts/v2/ERC20TransferProxyTest.sol
