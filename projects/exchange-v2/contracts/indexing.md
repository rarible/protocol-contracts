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

All deployed contract addresses can be found [here](../../hardhat-deploy/networks)

Here's a quick list to access Exchange contracts on some of the chains:

Mainnet: https://etherscan.io/address/0x9757F2d2b135150BBeb65308D4a91804107cd8D6  
Deployment block: 12617828  
Example purchase tx: https://etherscan.io/tx/0x32804b980d662138e3e79d3fc75aee9f8fbe55cd788898e255127e24853c8168

Base: https://basescan.org/address/0x6C65a3C3AA67b126e43F86DA85775E0F5e9743F7  
Deployment block: 8104020
Example purchase tx: https://basescan.org/tx/0x1d152615e913a370fec0b5bab9496008693cdd66e8e9e2f3983a76821aedcf93

RARI chain: https://rari.calderaexplorer.xyz/address/0x10CCBf49617ECB7A8262065853D6C93Ad42C3C2C  
Deployment block: 41  
Example purchase tx: https://rari.calderaexplorer.xyz/tx/0xf358dc9666955e24af86bbb324de9bef5833f1bc4aa956f610567ff00f361d40

Polygon: https://polygonscan.com/address/0x12b3897a36fDB436ddE2788C06Eff0ffD997066e      
Deployment block: 25193887   
Example purchase tx: https://polygonscan.com/tx/0x60b798217585d278206b1d5b23733b0dda8cd2414e66251ea105d42036d30a55     

ZKSync: https://explorer.zksync.io/address/0x5E0BbEd68e1b47C94a396226D8AC10DDe242e77c      
Deployment block: 21463932    
Example purchase tx: https://explorer.zksync.io/tx/0xfb72531be503d1a496661fdd959fee354095567d96e5177c4e4e2acb3d767346  

Arbitrum: https://arbiscan.io/address/0x07b637739CAd9A5f0c487219B283a52717E69978      
Deployment block: 149050273  
Example purchase tx:

5ire: https://5irescan.io/address/0x9b761A2C45daEd76Dfbcfd52d22cB930a0b41186      
Deployment block: 325043    
Example purchase tx:

Celo: https://celoscan.io/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97      
Deployment block: 23962374    
Example purchase tx: https://celoscan.io/tx/0x2c84c45bb1946aad26895034ff804a90a6aaee48dc157daadf45ca086e9de852  

Chiliz: https://scan.chiliz.com/address/0xdA12E4Ab1d731F29bF4Bff8f971579D95f8DDD07      

Astar ZKEVM: https://astar-zkevm.explorer.startale.com/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97      
Deployment block: 29362    
Example purchase tx: https://astar-zkevm.explorer.startale.com/tx/0x0bc59dd232cfc54c761c0364346ea93e7c69868e0ec69984ac009f4d0463d918  

Etherlink: https://explorer.etherlink.com/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97      
Deployment block: 191409  
Example purchase tx: https://explorer.etherlink.com/tx/0x664eb843d2b9394f7c0265e60c3ba600e8f1ccd77362f3f6b9607265be818b4a  

Kroma: https://blockscout.kroma.network/address/0x418f1b76448866CF072dd14d092138190CcdC9aF      
Deployment block: 7584226  
Example purchase tx: https://blockscout.kroma.network/tx/0x663f55fd26f51b4c09bcaa17ae852241e00858af700d9473b55aa3fc133b5549  

Lightlink: https://phoenix.lightlink.io/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97      
Deployment block: 54083026    
Example purchase tx: https://phoenix.lightlink.io/tx/0xfb020644a52064abcb8020b65b7b02d15f50f6523d27cc17aa7375252eaa0bff  

Lisk: https://blockscout.lisk.com/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97      
Deployment block: 614502    
Example purchase tx: https://blockscout.lisk.com/tx/0x96639b3f20da4f8cf3204cf63784e9ac7305e63cb26cdde39cc16b03f73a5a3a  

Mantle: https://explorer.mantle.xyz/address/0x0e7B24d73e45B639A5cF674C5f2Bb02930716f87        
Deployment block: 3787741   
Example purchase tx: https://explorer.mantle.xyz/tx/0xeb993ff6d8084ad6f8549293e8a6ea3de9259069049725822cbc10ce9e920ec1  

Matchain: https://matchscan.io/address/0x5faf16A85028BE138A7178B222DeC98092FEEF97?tab=txs      
Deployment block: 614254  
Example purchase tx: https://matchscan.io/tx/0x2cf7516b43491085ef43f7f7fa87aac2d5a58970da44aed119e930f60fa07a68     
