This document describes how to properly index data about secondary sales 

1. Listen to Match event from [ExchangeV2Core](./ExchangeV2Core.sol). This event doesn't contain all information to save the gas. It contains only information which can'be obtained using other data.
2. Other data can be fetched and parsed from the calldata (for function matchOrders) or by watching NFTs and ERC-20s exchanged during this call.

### Parsing matchOrders calldata ###

matchOrders has 4 arguments:
1. orderLeft - instance of [Order](./libraries/LibOrder.md) struct
2. signatureLeft
3. orderRight - instance of [Order](./libraries/LibOrder.md) struct
4. signatureRight

User can parse Order according to the [library](./libraries/LibOrder.md). Then it's required to parse [Assets](../../lib-asset/contracts/LibAsset.md).
Match event can be used to understand values exchanged.
If it's needed to get fees involved, then Order's data struct should be parsed according to the [document](./libraries/LibOrderData.md) 

### List of ExchangeV2 contracts on different chains

Mainnet: https://etherscan.io/address/0x9757F2d2b135150BBeb65308D4a91804107cd8D6
Base: https://basescan.org/address/0x139608ABeE12Ff39FEDae39C493B571A25995E10
RARI chain: https://rari.calderaexplorer.xyz/address/0x10CCBf49617ECB7A8262065853D6C93Ad42C3C2C
Polygon: https://polygonscan.com/address/0x12b3897a36fDB436ddE2788C06Eff0ffD997066e
ZKSync: https://explorer.zksync.io/address/0x5E0BbEd68e1b47C94a396226D8AC10DDe242e77c
Arbitrum: https://arbiscan.io/address/0x07b637739CAd9A5f0c487219B283a52717E69978
5ire: https://5irescan.io/address/0x9b761A2C45daEd76Dfbcfd52d22cB930a0b41186
Celo: https://celoscan.io/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97
Chiliz: https://scan.chiliz.com/address/0xdA12E4Ab1d731F29bF4Bff8f971579D95f8DDD07
Astar ZKEVM: https://astar-zkevm.explorer.startale.com/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97
Etherlink: https://explorer.etherlink.com/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97
Kroma: https://blockscout.kroma.network/address/0x418f1b76448866CF072dd14d092138190CcdC9aF
Lightlink: https://phoenix.lightlink.io/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97
Lisk: https://blockscout.lisk.com/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97
Mantle: https://explorer.mantle.xyz/address/0x0e7B24d73e45B639A5cF674C5f2Bb02930716f87
Matchain: https://matchscan.io/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97?tab=txs