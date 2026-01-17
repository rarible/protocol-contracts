# Deploy Packs on Base Chain

> **Note:** For the recommended step-by-step deployment, see **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** which provides:
> - `yarn step1:base` - Deploy item collections
> - `yarn step2:base` - Deploy pack infrastructure  
> - `yarn step3:base` - Mint and deposit items
> - `yarn step4:base` - Configure pool levels

This document covers the manual/advanced deployment process.

## Prerequisites

- Node.js 18+
- Yarn or npm
- Base RPC URL configured in `hardhat.config.ts`
- Private key with ETH on Base for gas
- Chainlink VRF subscription funded with LINK

## Step 1: Configure Parameters

### 1.1 Infrastructure Parameters

Edit `ignition/parameters/packInfrastructure.base.json`:

```json
{
  "PackInfrastructureModule": {
    "owner": "<YOUR_OWNER_ADDRESS>",
    "treasury": "<YOUR_TREASURY_ADDRESS>",
    "packName": "Rari Pack",
    "packSymbol": "RPACK",
    "useCustomPoolRanges": false,
    "customPoolRanges": []
  }
}
```

### 1.2 Setup Parameters

Edit `ignition/parameters/setupPackInfrastructure.base.json`:

```json
{
  "SetupPackInfrastructureModule": {
    "vrfCoordinator": "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",
    "vrfSubscriptionId": "<YOUR_VRF_SUBSCRIPTION_ID>",
    "vrfKeyHash": "0xdc2f87677b01473c763cb0aee938ed3341512f6057324a584e5944e786144d70",
    "vrfCallbackGasLimit": 500000,
    "vrfRequestConfirmations": 3,
    "bronzePrice": "10000000000000000",
    "silverPrice": "50000000000000000",
    "goldPrice": "100000000000000000",
    "platinumPrice": "500000000000000000",
    "bronzeUri": "https://rarible-drops.s3.filebase.com/Base/pack/bronze.json",
    "silverUri": "https://rarible-drops.s3.filebase.com/Base/pack/silver.json",
    "goldUri": "https://rarible-drops.s3.filebase.com/Base/pack/gold.json",
    "platinumUri": "ipfs://base-pack-platinum",
    "bronzeDescription": "Bronze pack for entry-level pulls from the common pool.",
    "silverDescription": "Silver pack with better chances into the rare pool.",
    "goldDescription": "Gold pack offering improved odds across rare and epic pools.",
    "platinumDescription": "Platinum pack with the best odds and access to the ultra-rare pool.",
    "enableInstantCash": false
  }
}
```

### Pack Prices Reference

| Pack | Price (ETH) | Price (Wei) |
|------|-------------|-------------|
| Bronze | 0.01 | 10000000000000000 |
| Silver | 0.05 | 50000000000000000 |
| Gold | 0.1 | 100000000000000000 |
| Platinum | 0.5 | 500000000000000000 |

## Step 2: Deploy Contracts

Navigate to the packs directory:

```bash
cd protocol/packs
```

### Option A: Using Yarn Script (Recommended)

```bash
yarn deploy:base
```

### Option B: Using Hardhat Ignition CLI

```bash
# Deploy infrastructure (RariPack, NftPool, PackManager)
npx hardhat ignition deploy ignition/modules/PackInfrastructure.ts \
  --network base \
  --parameters ignition/parameters/packInfrastructure.base.json

# Setup configuration (VRF, prices, URIs, roles)
npx hardhat ignition deploy ignition/modules/SetupPackInfrastructure.ts \
  --network base \
  --parameters ignition/parameters/setupPackInfrastructure.base.json
```

## Step 3: Post-Deployment Setup

### 3.1 Verify Contracts on BaseScan

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 3.2 Add PackManager to VRF Subscription

1. Go to [Chainlink VRF](https://vrf.chain.link/)
2. Select your subscription
3. Add the **PackManager proxy address** as a consumer

### 3.3 Configure NFT Collections

For each NFT collection you want to include in the pool:

```solidity
// POOL_MANAGER_ROLE required
nftPool.configureCollection(collectionAddress, true, floorPriceInWei);
```

### 3.4 Deposit NFTs into Pool

```solidity
// Approve NFT
nft.approve(nftPoolAddress, tokenId);

// Deposit to pool
nftPool.deposit(collectionAddress, tokenId);
```

Ensure all 5 pool levels have NFTs before enabling pack opening:
- Common (0 - 0.5 ETH floor)
- Rare (0.5 - 2 ETH floor)
- Epic (2 - 10 ETH floor)
- Legendary (10 - 50 ETH floor)
- UltraRare (50+ ETH floor)

## Step 4: Test the Deployment

### Mint a Pack

```solidity
rariPack.mintPack{value: packPrice}(userAddress, packType, 1);
```

### Open a Pack

```solidity
// Triggers VRF request
packManager.openPack(packTokenId);

// After VRF callback, claim NFTs or ETH reward
packManager.claimNft(packTokenId);
// OR
packManager.claimReward(packTokenId);  // 80% floor price in ETH
```

## Step 5: Deploy Item Collections

Deploy 5 NFT collections for pack items (Common, Rare, Epic, Legendary, UltraRare).

### 5.1 Configure Item Collection Parameters

Edit `ignition/parameters/itemCollections.base.json`:

```json
{
  "ItemCollectionsModule": {
    "owner": "<YOUR_OWNER_ADDRESS>",
    "commonUri": "https://rarible-drops.s3.filebase.com/Base/item/common.json",
    "rareUri": "https://rarible-drops.s3.filebase.com/Base/item/rare.json",
    "epicUri": "https://rarible-drops.s3.filebase.com/Base/item/epic.json",
    "legendaryUri": "https://rarible-drops.s3.filebase.com/Base/item/legendary.json",
    "ultraRareUri": "https://rarible-drops.s3.filebase.com/Base/item/ultra-rare.json"
  }
}
```

### 5.2 Deploy Item Collections

```bash
cd protocol/packs

# Option A: Using Yarn Script
yarn deploy:items:base

# Option B: Using Hardhat Ignition CLI
npx hardhat ignition deploy ignition/modules/ItemCollections.ts \
  --network base \
  --parameters ignition/parameters/itemCollections.base.json
```

### 5.3 Verify Item Contracts

```bash
npx hardhat verify --network base <COMMON_ADDRESS> \
  "Common Pool Item" "COMMON" "https://rarible-drops.s3.filebase.com/Base/item/common.json" "<OWNER>"
```

## Step 6: Configure NftPool with Collections

### 6.1 Configure Collections with Floor Prices

Each collection needs to be registered with NftPool along with its floor price:

| Collection | Floor Price (ETH) | Floor Price (Wei) |
|------------|-------------------|-------------------|
| Common | 0.1 | 100000000000000000 |
| Rare | 0.5 | 500000000000000000 |
| Epic | 2.0 | 2000000000000000000 |
| Legendary | 10.0 | 10000000000000000000 |
| UltraRare | 50.0 | 50000000000000000000 |

```solidity
// Configure each collection (requires POOL_MANAGER_ROLE)
nftPool.configureCollection(commonAddress, true, 100000000000000000);
nftPool.configureCollection(rareAddress, true, 500000000000000000);
nftPool.configureCollection(epicAddress, true, 2000000000000000000);
nftPool.configureCollection(legendaryAddress, true, 10000000000000000000);
nftPool.configureCollection(ultraRareAddress, true, 50000000000000000000);
```

### 6.2 Mint Items to Collections

```solidity
// Mint 100 items to each collection
commonCollection.mintBatch(ownerAddress, 100);
rareCollection.mintBatch(ownerAddress, 100);
epicCollection.mintBatch(ownerAddress, 100);
legendaryCollection.mintBatch(ownerAddress, 100);
ultraRareCollection.mintBatch(ownerAddress, 100);
```

### 6.3 Deposit Items into NftPool

```solidity
// Approve NftPool for all tokens
commonCollection.setApprovalForAll(nftPoolAddress, true);
rareCollection.setApprovalForAll(nftPoolAddress, true);
epicCollection.setApprovalForAll(nftPoolAddress, true);
legendaryCollection.setApprovalForAll(nftPoolAddress, true);
ultraRareCollection.setApprovalForAll(nftPoolAddress, true);

// Deposit items (repeat for each token)
nftPool.deposit(commonAddress, tokenId);
nftPool.deposit(rareAddress, tokenId);
// ... etc
```

## Metadata Files

Pack and item metadata are stored in:

```
metadata/base/
├── pack/
│   ├── gold.json
│   ├── silver.json
│   └── bronze.json
└── item/
    ├── common.json
    ├── rare.json
    ├── epic.json
    ├── legendary.json
    └── ultra-rare.json
```

Upload these to your hosting (S3, IPFS) and update the URIs in the setup parameters.

## Troubleshooting

### VRF Callback Not Received

- Ensure PackManager is added as a consumer in VRF subscription
- Check subscription has enough LINK
- Verify `vrfCallbackGasLimit` is sufficient (500000 recommended)

### Pack Opening Fails

- Ensure pool has NFTs in all required levels for the pack type
- Check VRF subscription is active and funded

### Contract Verification Fails

- Use flattened source or standard JSON input
- Ensure constructor args match deployment

## Deployed Contract Addresses

After deployment, addresses are saved to:

```
ignition/deployments/chain-8453/
```

| Contract | Address |
|----------|---------|
| RariPack (Proxy) | `<DEPLOYED_ADDRESS>` |
| NftPool (Proxy) | `<DEPLOYED_ADDRESS>` |
| PackManager (Proxy) | `<DEPLOYED_ADDRESS>` |
| ProxyAdmin | `<DEPLOYED_ADDRESS>` |

## Useful Links

- [Chainlink VRF Dashboard](https://vrf.chain.link/)
- [Base Block Explorer](https://basescan.org/)
- [Chainlink VRF Docs - Base](https://docs.chain.link/vrf/v2-5/supported-networks#base-mainnet)
