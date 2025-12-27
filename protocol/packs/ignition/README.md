# Pack Infrastructure Deployment

This folder contains Hardhat Ignition modules for deploying and configuring the complete Pack NFT infrastructure.

## Architecture Overview

The pack system consists of three main contracts:

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    RariPack     │   │   PackManager   │   │    NftPool      │
│   (ERC-721)     │◄──┤   (VRF Logic)   │──►│ (NFT Storage)   │
│                 │   │                 │   │                 │
│ • Mint packs    │   │ • Open packs    │   │ • Single pool   │
│ • Pack types    │   │ • VRF random    │   │ • 5 price levels│
│ • Metadata      │   │ • Claim NFTs    │   │ • Lock/Unlock   │
│ • Pricing       │   │ • Instant ETH   │   │ • Selection     │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Modules

### Individual Modules

- **RariPack.ts** - Deploys only the RariPack contract (pack NFTs)
- **NftPool.ts** - Deploys the single NftPool contract (manages all 5 pool levels)
- **PackManager.ts** - Deploys only the PackManager contract

### Combined Modules

- **PackInfrastructure.ts** - Deploys the complete infrastructure in one transaction batch:
  - RariPack (implementation + proxy)
  - NftPool (implementation + proxy) - single pool with 5 price-based levels
  - PackManager (implementation + proxy)

- **SetupPackInfrastructure.ts** - Configures all the relationships after deployment:
  - Grants BURNER_ROLE to PackManager on RariPack
  - Grants POOL_MANAGER_ROLE to PackManager on NftPool
  - Sets NftPool address in PackManager
  - Configures Chainlink VRF
  - Sets pack prices, URIs, and descriptions
  - Optionally enables instant cash claims

## Deployment Steps

### Option 1: Full Deployment (Recommended)

1. **Update parameters** in `parameters/packInfrastructure.json`:
   ```json
   {
     "PackInfrastructureModule": {
       "owner": "<OWNER_ADDRESS>",
       "treasury": "<TREASURY_ADDRESS>",
       "packName": "Rari Pack",
       "packSymbol": "RPACK",
       "useCustomPoolRanges": false,
       "customPoolRanges": []
     }
   }
   ```

2. **Deploy infrastructure**:
   ```bash
   npx hardhat ignition deploy ignition/modules/PackInfrastructure.ts --network <NETWORK> --parameters ignition/parameters/packInfrastructure.json
   ```

3. **Update setup parameters** in `parameters/setupPackInfrastructure.json` with deployed addresses:
   ```json
   {
     "SetupPackInfrastructureModule": {
       "rariPackProxy": "<DEPLOYED_RARIPACK_PROXY>",
       "packManagerProxy": "<DEPLOYED_PACKMANAGER_PROXY>",
       "nftPoolProxy": "<DEPLOYED_NFTPOOL_PROXY>",
       "vrfCoordinator": "<CHAINLINK_VRF_COORDINATOR>",
       "vrfSubscriptionId": "<VRF_SUBSCRIPTION_ID>",
       "vrfKeyHash": "<VRF_KEY_HASH>",
       ...
     }
   }
   ```

4. **Run setup**:
   ```bash
   npx hardhat ignition deploy ignition/modules/SetupPackInfrastructure.ts --network <NETWORK> --parameters ignition/parameters/setupPackInfrastructure.json
   ```

### Option 2: Individual Deployments

Deploy contracts separately:

```bash
# Deploy RariPack
npx hardhat ignition deploy ignition/modules/RariPack.ts --network <NETWORK> --parameters ignition/parameters/rariPack.json

# Deploy NftPool
npx hardhat ignition deploy ignition/modules/NftPool.ts --network <NETWORK> --parameters ignition/parameters/nftPool.json

# Deploy PackManager
npx hardhat ignition deploy ignition/modules/PackManager.ts --network <NETWORK> --parameters ignition/parameters/packManager.json
```

Then run the setup module to configure relationships.

## Parameter Files

| File | Module | Description |
|------|--------|-------------|
| `packInfrastructure.json` | PackInfrastructureModule | Full infrastructure deployment |
| `packInfrastructure.base.json` | PackInfrastructureModule | Base mainnet template (chain-8453) |
| `setupPackInfrastructure.json` | SetupPackInfrastructureModule | Configuration after deployment |
| `setupPackInfrastructure.base.json` | SetupPackInfrastructureModule | Base mainnet template (chain-8453) |
| `rariPack.json` | RariPackModule | Individual RariPack deployment |
| `nftPool.json` | NftPoolModule | Individual NftPool deployment |
| `packManager.json` | PackManagerModule | Individual PackManager deployment |

## Base Mainnet (chainId 8453)

Ignition “settings” for Base are just:
- Run Ignition with `--network base` (from `hardhat.config.ts`)
- Deployments will be written to `ignition/deployments/chain-8453/`
- Parameter files can be:
  - `ignition/parameters/packInfrastructure.base.json`
  - `ignition/parameters/setupPackInfrastructure.base.json`

### Deploy via scripts (recommended)

```bash
# from protocol/packs
yarn deploy:base
```

### Deploy via Ignition CLI directly

```bash
# from protocol/packs
npx hardhat ignition deploy ignition/modules/PackInfrastructure.ts --network base --parameters ignition/parameters/packInfrastructure.base.json

# then edit setupPackInfrastructure.base.json with the deployed proxy addresses + Base VRF details
npx hardhat ignition deploy ignition/modules/SetupPackInfrastructure.ts --network base --parameters ignition/parameters/setupPackInfrastructure.base.json
```

## Pool Levels & Price Ranges

NftPool automatically categorizes NFTs into 5 levels based on collection floor prices:

| Level | Default Floor Price Range | Description |
|-------|---------------------------|-------------|
| Common | 0 - 0.5 ETH | Entry-level NFTs |
| Rare | 0.5 - 2 ETH | Uncommon NFTs |
| Epic | 2 - 10 ETH | Notable NFTs |
| Legendary | 10 - 50 ETH | High-value NFTs |
| UltraRare | 50+ ETH | Elite NFTs (Platinum packs only) |

### Custom Pool Ranges

To use custom price ranges, set `useCustomPoolRanges: true` and provide a `customPoolRanges` array:

```json
{
  "PackInfrastructureModule": {
    "useCustomPoolRanges": true,
    "customPoolRanges": [
      { "lowPrice": "0", "highPrice": "1000000000000000000" },
      { "lowPrice": "1000000000000000000", "highPrice": "5000000000000000000" },
      { "lowPrice": "5000000000000000000", "highPrice": "20000000000000000000" },
      { "lowPrice": "20000000000000000000", "highPrice": "100000000000000000000" },
      { "lowPrice": "100000000000000000000", "highPrice": "115792089237316195423570985008687907853269984665640564039457584007913129639935" }
    ]
  }
}
```

## Chainlink VRF Configuration

Before deployment, you need to:

1. Create a VRF subscription at [Chainlink VRF](https://vrf.chain.link/)
2. Fund the subscription with LINK
3. Get the coordinator address and key hash for your network
4. Add the PackManager proxy address as a consumer after deployment

### VRF Addresses by Network

| Network | Coordinator | Key Hash |
|---------|-------------|----------|
| Ethereum Mainnet | `0x271682DEB8C4E0901D1a1550aD2e64D568E69909` | See [docs](https://docs.chain.link/vrf/v2-5/supported-networks) |
| Sepolia | `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625` | See [docs](https://docs.chain.link/vrf/v2-5/supported-networks) |
| Polygon | `0xAE975071Be8F8eE67addBC1A82488F1C24858067` | See [docs](https://docs.chain.link/vrf/v2-5/supported-networks) |
| Arbitrum | `0x41034678D6C633D8a95c75e1138A360a28bA15d1` | See [docs](https://docs.chain.link/vrf/v2-5/supported-networks) |
| Base | `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634` | See [docs](https://docs.chain.link/vrf/v2-5/supported-networks) |

## Default Pack Prices

| Pack Type | Price (ETH) | Price (Wei) |
|-----------|-------------|-------------|
| Bronze | 0.01 | 10000000000000000 |
| Silver | 0.05 | 50000000000000000 |
| Gold | 0.1 | 100000000000000000 |
| Platinum | 0.5 | 500000000000000000 |

## Default Drop Rates

Higher tier packs have progressively better odds:

| Pack Type | UltraRare | Legendary | Epic | Rare | Common |
|-----------|-----------|-----------|------|------|--------|
| **Platinum** | 0.5% | 2% | 7% | 20% | 70.5% |
| **Gold** | — | 1% | 5% | 15% | 79% |
| **Silver** | — | 0.5% | 3% | 10% | 86.5% |
| **Bronze** | — | 0.2% | 1% | 5% | 93.8% |

## Post-Deployment Checklist

After deployment and setup:

- [ ] Verify all contracts on block explorer
- [ ] Add PackManager to VRF subscription as consumer
- [ ] Configure NFT collections on NftPool:
  ```solidity
  nftPool.configureCollection(collectionAddress, true, floorPriceInWei);
  ```
- [ ] Deposit NFTs into NftPool (must be from allowed collections):
  ```solidity
  nft.approve(nftPoolAddress, tokenId);
  nftPool.deposit(collectionAddress, tokenId);
  ```
- [ ] Ensure all 5 pool levels have NFTs before enabling pack opening
- [ ] (Optional) Fund PackManager treasury for instant cash payouts
- [ ] (Optional) Enable instant cash: `packManager.setInstantCashEnabled(true)`
- [ ] Test minting a pack
- [ ] Test opening a pack (VRF fulfillment)
- [ ] Transfer ownership if needed

## Contract Interactions Summary

### Adding NFTs to Pool

```solidity
// 1. Configure collection (POOL_MANAGER_ROLE required)
nftPool.configureCollection(collectionAddress, true, floorPrice);

// 2. Approve and deposit NFTs (anyone can deposit to allowed collections)
nft.approve(nftPoolAddress, tokenId);
nftPool.deposit(collectionAddress, tokenId);
```

### Opening a Pack

```solidity
// 1. User mints a pack
rariPack.mintPack{value: packPrice}(userAddress, packType, 1);

// 2. User opens pack (triggers VRF request)
packManager.openPack(packTokenId);

// 3. VRF callback fulfills and locks NFTs in pack

// 4. User claims either NFTs or ETH reward
packManager.claimNft(packTokenId);  // Get NFTs
// OR
packManager.claimReward(packTokenId);  // Get 80% floor price in ETH
```

## Upgradeability

All contracts are deployed behind TransparentUpgradeableProxy. To upgrade:

```bash
# Deploy new implementation
npx hardhat ignition deploy ignition/modules/<Contract>.ts --network <NETWORK>

# Use ProxyAdmin to upgrade
proxyAdmin.upgrade(proxyAddress, newImplementationAddress);
```
