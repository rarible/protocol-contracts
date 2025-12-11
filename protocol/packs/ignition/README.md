# Pack Infrastructure Deployment

This folder contains Hardhat Ignition modules for deploying and configuring the complete Pack NFT infrastructure.

## Modules

### Individual Modules

- **RariPack.ts** - Deploys only the RariPack contract (pack NFTs)
- **NftPools.ts** - Deploys all 5 NFT pool contracts (Common, Rare, Epic, Legendary, UltraRare)
- **PackManager.ts** - Deploys only the PackManager contract

### Combined Modules

- **PackInfrastructure.ts** - Deploys the complete infrastructure in one transaction batch:
  - RariPack (implementation + proxy)
  - NftPool implementation (shared)
  - 5 NftPool proxies (one per rarity tier)
  - PackManager (implementation + proxy)

- **SetupPackInfrastructure.ts** - Configures all the relationships after deployment:
  - Grants BURNER_ROLE to PackManager on RariPack
  - Grants POOL_MANAGER_ROLE to PackManager on all pools
  - Sets pool addresses in PackManager
  - Configures Chainlink VRF
  - Sets pack prices
  - Sets pack URIs

## Deployment Steps

### Option 1: Full Deployment (Recommended)

1. **Update parameters** in `parameters/packInfrastructure.json`:
   ```json
   {
     "PackInfrastructureModule": {
       "owner": "<OWNER_ADDRESS>",
       "treasury": "<TREASURY_ADDRESS>",
       "vrfCoordinator": "<CHAINLINK_VRF_COORDINATOR>",
       "vrfSubscriptionId": "<VRF_SUBSCRIPTION_ID>",
       "vrfKeyHash": "<VRF_KEY_HASH>",
       ...
     }
   }
   ```

2. **Deploy infrastructure**:
   ```bash
   yarn deploy:infrastructure --network <NETWORK>
   ```

3. **Update setup parameters** in `parameters/setupPackInfrastructure.json` with deployed addresses

4. **Run setup**:
   ```bash
   yarn deploy:setup --network <NETWORK>
   ```

### Option 2: Individual Deployments

Deploy contracts separately:

```bash
# Deploy RariPack
yarn deploy:raripack --network <NETWORK>

# Deploy NFT Pools
yarn deploy:pools --network <NETWORK>

# Deploy PackManager
yarn deploy:packmanager --network <NETWORK>
```

Then run the setup module to configure relationships.

## Parameter Files

| File | Module | Description |
|------|--------|-------------|
| `packInfrastructure.json` | PackInfrastructureModule | Full infrastructure deployment |
| `setupPackInfrastructure.json` | SetupPackInfrastructureModule | Configuration after deployment |
| `rariPack.json` | RariPackModule | Individual RariPack deployment |
| `nftPools.json` | NftPoolsModule | Individual pools deployment |
| `packManager.json` | PackManagerModule | Individual PackManager deployment |

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

## Default Pack Prices

| Pack Type | Price (ETH) | Price (Wei) |
|-----------|-------------|-------------|
| Bronze | 0.01 | 10000000000000000 |
| Silver | 0.05 | 50000000000000000 |
| Gold | 0.1 | 100000000000000000 |
| Platinum | 0.5 | 500000000000000000 |

## Default Drop Rates

| Pool Type | Drop Rate | Cumulative |
|-----------|-----------|------------|
| UltraRare | 0.1% | 0.1% (Platinum only) |
| Legendary | 0.4% | 0.5% |
| Epic | 1.5% | 2% |
| Rare | 7% | 9% |
| Common | 91% | 100% |

## Post-Deployment Checklist

After deployment and setup:

- [ ] Verify all contracts on block explorer
- [ ] Add PackManager to VRF subscription as consumer
- [ ] Add allowed NFT collections to each pool
- [ ] Deposit NFTs into pools
- [ ] Test minting a pack
- [ ] Test opening a pack (VRF fulfillment)
- [ ] Transfer ownership if needed

