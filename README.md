## Smart contracts for Rarible protocol

Consists of:

- Exchange v2: responsible for sales, auctions etc.
- Tokens: for storing information about NFTs
- Specifications for on-chain royalties supported by Rarible

## Compile, Test, Deploy

```shell
yarn
yarn bootstrap
```

then use truffle to compile, test: cd into directory and then

```shell
truffle test --compile-all
```

## Overview of the protocol

Rarible protocol is a combination of smart-contracts for exchanging tokens, tokens themselves, APIs for order creation, discovery, standards used in smart contracts.

Protocol is primarily targeted to NFTs, but it's not limited to NFTs only. Any asset on EVM blockchain can be traded on Rarible.

Smart contracts are constructed in the way to be upgradeable, orders have versioning information, so new fields can be added if needed in future.

## Trade process overview

Users should do these steps to successfully trade on Rarible:

- approve transfers for their assets to Exchange contracts (e.g.: call approveForAll for ERC-721, approve for ERC-20) - amount of money needed for trade is price + fee on top of that. learn more at exchange contracts readme
- sign trading order via preferred wallet (order is like a statement "I would like to sell my precious crypto kitty for 10 ETH")
- save this order and signature to the database using Rarible protocol API (in future, storing orders on-chain will be supported too)

If user wants to cancel order, he must call cancel function of the Exchange smart contract

Users who want to purchase something on Rarible should do the following:

- find asset they like with an open order
- approve transfers the same way (if not buying using Ether)
- form order in the other direction (statement like "I would like to buy precious crypto kitty for 10 ETH")
- call Exchange.matchOrders with two orders and first order signature. 

### Suggestions

You are welcome to [suggest features](https://github.com/rarible/protocol/discussions) and [report bugs found](https://github.com/rarible/protocol/issues)!

### License

Smart contracts for Rarible protocol are available under the [MIT License](LICENSE.md).