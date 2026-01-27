# NFT Pack System - YAML-Based Deployment Guide

Complete guide for deploying NftPool and PackManager using YAML configuration files.

## Overview

The new deployment workflow uses YAML files for configuration, making deployments:
- **Reproducible**: All settings stored in version-controlled YAML files
- **Auditable**: Easy to review and verify configuration before deployment
- **Flexible**: Deploy to any network with the same configuration structure

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. DEPLOY COLLECTIONS                                                      │
│     ┌─────────────────────┐                                                 │
│     │ deploy-collections  │ ──────► collections.yaml                        │
│     └─────────────────────┘         (addresses + token IDs)                 │
│                                                                             │
│  2. DEPLOY INFRASTRUCTURE                                                   │
│     ┌──────────────────────────┐                                            │
│     │ infrastructure.yaml      │ ──► deploy-nft-infrastructure              │
│     │ (pool ranges, VRF, etc.) │     │                                      │
│     └──────────────────────────┘     ▼                                      │
│                                 infrastructure.yaml (deployed addresses)    │
│                                                                             │
│  3. CONFIGURE COLLECTIONS                                                   │
│     ┌──────────────────────────┐                                            │
│     │ collections.yaml         │ ──► process-collections                    │
│     │ + infrastructure.yaml    │     │                                      │
│     └──────────────────────────┘     ▼                                      │
│                                 Collections configured in NftPool           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Node.js 18+** and **Yarn**
2. **RPC URL** configured in `.env` or `hardhat.config.ts`
3. **Deployer private key** with ETH for gas
4. **Chainlink VRF subscription** funded with LINK ([vrf.chain.link](https://vrf.chain.link/))
5. **Existing RariPack contract** (pack NFT contract)

## Quick Start

```bash
cd protocol/packs
yarn install

# 1. Deploy test collections (outputs collections.yaml)
yarn deploy-collections:sepolia

# 2. Deploy NftPool and PackManager (uses infrastructure.yaml config)
INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia

# 3. Configure collections in NftPool
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/YYYY-MM-DD/collections.yaml \
yarn process-collections:sepolia
```

**Important:** Always pass config inputs (`INFRA_CONFIG`, `COLLECTIONS_CONFIG`) inline with each command.
Shell sessions can be closed and reopened, so do not rely on exported environment variables.

---

## Step 1: Deploy Collections

Deploy test NFT collections and mint items.

### Command

```bash
# Sepolia
yarn deploy-collections:sepolia

# Base
yarn deploy-collections:base
```

### What it does

1. Deploys 5 `ItemCollection` contracts (ERC721A):
   - Common, Rare, Epic, Legendary, UltraRare
2. Mints items to each collection
3. Outputs `collections.yaml` with addresses and token IDs

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ITEM_COLLECTION_OWNER` | Owner address for collections | Network default |
| `MINT_COMMON` | Number of Common items to mint | 50 (sepolia) / 10 (base) |
| `MINT_RARE` | Number of Rare items to mint | 30 / 8 |
| `MINT_EPIC` | Number of Epic items to mint | 15 / 5 |
| `MINT_LEGENDARY` | Number of Legendary items to mint | 8 / 3 |
| `MINT_ULTRA_RARE` | Number of UltraRare items to mint | 5 / 2 |
| `FLOOR_COMMON` | Floor price in ETH | 0.01 |
| `FLOOR_RARE` | Floor price in ETH | 0.08 |
| `FLOOR_EPIC` | Floor price in ETH | 0.35 |
| `FLOOR_LEGENDARY` | Floor price in ETH | 2.5 |
| `FLOOR_ULTRA_RARE` | Floor price in ETH | 8.0 |
| `SKIP_MINT` | Skip minting (use existing) | false |

### Output

```
deployments/<network>/<date>/collections.yaml
```

**Example `collections.yaml`:**

```yaml
network: sepolia
chainId: "11155111"
generatedAt: "2026-01-27T12:00:00.000Z"
deployer: "0xa95a09520af0f1bbef810a47560c79affe75aa9f"
owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f"

collections:
  - name: Common Pool Item
    address: "0x1234567890123456789012345678901234567890"
    priceLevel: "0.01"
    poolLevel: Common
    tokenIds:
      - 1
      - 2
      - 3
      # ... more token IDs

  - name: Rare Pool Item
    address: "0x2345678901234567890123456789012345678901"
    priceLevel: "0.08"
    poolLevel: Rare
    tokenIds:
      - 1
      - 2
      # ...
```

---

## Step 2: Configure Infrastructure YAML

Before deploying NftPool and PackManager, review and customize the infrastructure configuration.

### Configuration Files

Pre-configured files are available in `config/`:

| File | Network | Description |
|------|---------|-------------|
| `config/infrastructure.sepolia.yaml` | Sepolia | Testnet configuration |
| `config/infrastructure.base.yaml` | Base | Mainnet configuration |

### Configuration Structure

```yaml
# Network identification
network: sepolia
chainId: "11155111"

# Contract owner
owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f"

# Existing RariPack contract (REQUIRED)
rariPack: "0x6A811146A81183393533602DD9fB98E2F66A8d10"

# Pool price ranges (5 levels)
poolRanges:
  - level: Common
    lowPriceEth: 0
    highPriceEth: 0.05325

  - level: Rare
    lowPriceEth: 0.05325
    highPriceEth: 0.213

  - level: Epic
    lowPriceEth: 0.213
    highPriceEth: 1.065

  - level: Legendary
    lowPriceEth: 1.065
    highPriceEth: 5.325

  - level: UltraRare
    lowPriceEth: 5.325
    highPriceEth: infinity  # No upper bound

# PackManager settings
packManager:
  instantCashEnabled: false
  treasuryThresholdEth: 5.0
  payoutTreasury: "0x..."

  # Chainlink VRF v2.5
  vrf:
    coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"
    subscriptionId: "31234815417281375020060825130305937433281857209550563487914138707724720747173"
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"
    callbackGasLimit: 500000
    requestConfirmations: 3

  # Pack probabilities (cumulative thresholds out of 10000)
  probabilities:
    bronze:
      ultraRare: 0      # Not available
      legendary: 20     # 0.2%
      epic: 120         # 1%
      rare: 620         # 5%
    silver:
      ultraRare: 0
      legendary: 50     # 0.5%
      epic: 350         # 3%
      rare: 1350        # 10%
    gold:
      ultraRare: 0
      legendary: 100    # 1%
      epic: 600         # 5%
      rare: 2100        # 15%
    platinum:
      ultraRare: 50     # 0.5% (exclusive)
      legendary: 250    # 2%
      epic: 950         # 7%
      rare: 2950        # 20%
```

### Key Settings Explained

#### Pool Ranges

Pool ranges determine which pool level a collection belongs to based on its floor price:

| Level | Default Range (ETH) | Description |
|-------|---------------------|-------------|
| Common | 0 - 0.05325 | Entry-level items |
| Rare | 0.05325 - 0.213 | Uncommon items |
| Epic | 0.213 - 1.065 | Mid-tier valuable items |
| Legendary | 1.065 - 5.325 | High-value items |
| UltraRare | 5.325+ | Most valuable, Platinum-only |

#### Pack Probabilities

Probabilities are **cumulative thresholds** out of 10000 (100.00%):

```
Roll: 0 ─────────────────────────────────────────────────────── 10000
      │ultraRare│  legendary  │    epic    │    rare    │  common  │
      │   50    │     250     │    950     │    2950    │   10000  │
      │  0.5%   │     2%      │     7%     │    20%     │   70.5%  │
```

For Platinum packs:
- Roll 0-49 (0.5%): UltraRare
- Roll 50-249 (2%): Legendary  
- Roll 250-949 (7%): Epic
- Roll 950-2949 (20%): Rare
- Roll 2950-9999 (70.5%): Common

---

## Step 3: Deploy NftPool and PackManager

### Command

```bash
INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia
```

### What it does

1. **Deploys NftPool** (implementation + proxy)
   - Initialized with pool price ranges from YAML
2. **Deploys PackManager** (implementation + proxy)
   - Initialized with RariPack address
3. **Configures roles**
   - Grants `POOL_MANAGER_ROLE` to PackManager on NftPool
4. **Configures PackManager**
   - Sets VRF configuration
   - Sets pack probabilities
   - Configures instant cash settings

### Output

```
deployments/<network>/<date>/
├── nft-infrastructure.json    # Full deployment details
└── infrastructure.yaml        # Deployed contract addresses
```

**Example output `infrastructure.yaml`:**

```yaml
network: sepolia
chainId: "11155111"
deployedAt: "2026-01-27T12:30:00.000Z"
owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f"

contracts:
  nftPool: "0xf1F50d5A9a629Bf663d7c90a83070A36b367C3a1"
  packManager: "0x2AB951b1A381938F9671FD77f2cf1e0A418C96C7"
  rariPack: "0x6A811146A81183393533602DD9fB98E2F66A8d10"

implementations:
  nftPool: "0xb05CDEF19f348A2048Afc21aDB5A19A6D63CE29b"
  packManager: "0x71c265867AfF7B0a7826C2918769250d1d1Efa16"
```

### Post-Deployment Actions

⚠️ **IMPORTANT**: After deployment, you must:

1. **Add PackManager to VRF Subscription**
   - Go to [vrf.chain.link](https://vrf.chain.link/)
   - Add PackManager address as a consumer

2. **Grant BURNER_ROLE to PackManager on RariPack**
   ```solidity
   rariPack.grantRole(BURNER_ROLE, packManagerAddress)
   ```

---

## Step 4: Configure Collections in NftPool

### Command

```bash
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \
yarn process-collections:sepolia
```

### With NFT deposits

```bash
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \
DEPOSIT_NFTS=true \
yarn process-collections:sepolia
```

### What it does

1. Reads collection data from `collections.yaml`
2. Configures each collection in NftPool with floor price
3. Optionally deposits NFTs to the pool
4. Safely resumes if interrupted by reading on-chain state (skips already configured collections and already-deposited NFTs)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COLLECTIONS_CONFIG` | Path to collections YAML | Required |
| `INFRA_CONFIG` | Path to infrastructure YAML | Required |
| `DEPOSIT_NFTS` | Deposit NFTs to pool | false |
| `LOG_EVERY` | Log deposit progress every N tokens | 10 |

### Output

```
Processing Complete

┌─────────────────────────────┬──────────────────────┬───────────┬────────────┬──────┐
│ Collection                  │ Address              │ Price ETH │ Pool Level │ NFTs │
├─────────────────────────────┼──────────────────────┼───────────┼────────────┼──────┤
│ ✓ Common Pool Item          │ 0x1234...7890        │      0.01 │ Common     │   50 │
│ ✓ Rare Pool Item            │ 0x2345...8901        │      0.08 │ Rare       │   30 │
│ ✓ Epic Pool Item            │ 0x3456...9012        │      0.35 │ Epic       │   15 │
│ ✓ Legendary Pool Item       │ 0x4567...0123        │       2.5 │ Legendary  │    8 │
│ ✓ UltraRare Pool Item       │ 0x5678...1234        │       8.0 │ UltraRare  │    5 │
└─────────────────────────────┴──────────────────────┴───────────┴────────────┴──────┘

Configured: 5/5 collections
Deposited: 108 NFTs total
```

---

## Complete Example

### Sepolia Testnet Deployment

```bash
cd protocol/packs

# Step 1: Deploy collections
yarn deploy-collections:sepolia
# Output: deployments/sepolia/2026-01-27/collections.yaml

# Step 2: Deploy infrastructure
INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia
# Output: deployments/sepolia/2026-01-27/infrastructure.yaml

# Step 3: Add PackManager to VRF subscription at vrf.chain.link
# Step 4: Grant BURNER_ROLE to PackManager on RariPack

# Step 5: Configure collections and deposit NFTs
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \
DEPOSIT_NFTS=true \
yarn process-collections:sepolia
```

### Base Mainnet Deployment

```bash
cd protocol/packs

# Step 1: Deploy collections (smaller amounts for mainnet)
MINT_COMMON=10 MINT_RARE=8 MINT_EPIC=5 MINT_LEGENDARY=3 MINT_ULTRA_RARE=2 \
yarn deploy-collections:base

# Step 2: Deploy infrastructure
INFRA_CONFIG=config/infrastructure.base.yaml yarn deploy:nft-infra:base

# Step 3: Post-deployment setup (VRF + BURNER_ROLE)

# Step 4: Configure collections
INFRA_CONFIG=config/infrastructure.base.yaml \
COLLECTIONS_CONFIG=deployments/base/2026-01-27/collections.yaml \
DEPOSIT_NFTS=true \
yarn process-collections:base
```

---

## File Structure

```
protocol/packs/
├── config/
│   ├── infrastructure.base.yaml       # Base mainnet config
│   ├── infrastructure.sepolia.yaml    # Sepolia testnet config
│   └── collections.example.yaml       # Example collections format
├── deployments/
│   ├── base/
│   │   └── YYYY-MM-DD/
│   │       ├── collections.yaml       # Deployed collections
│   │       ├── infrastructure.yaml    # Deployed infrastructure
│   │       └── nft-infrastructure.json
│   └── sepolia/
│       └── YYYY-MM-DD/
│           └── ...
├── scripts/
│   ├── deploy-collections.ts          # Deploy & mint collections
│   ├── deploy-nft-infrastructure.ts   # Deploy NftPool & PackManager
│   └── 5-process-collections.ts       # Configure collections in NftPool
└── docs/
    └── YAML_DEPLOYMENT_GUIDE.md       # This file
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `yarn deploy-collections:sepolia` | Deploy collections on Sepolia |
| `yarn deploy-collections:base` | Deploy collections on Base |
| `INFRA_CONFIG=<yaml> yarn deploy:nft-infra:sepolia` | Deploy NftPool/PackManager on Sepolia |
| `INFRA_CONFIG=<yaml> yarn deploy:nft-infra:base` | Deploy NftPool/PackManager on Base |
| `INFRA_CONFIG=<yaml> COLLECTIONS_CONFIG=<yaml> yarn process-collections:sepolia` | Configure collections on Sepolia |
| `INFRA_CONFIG=<yaml> COLLECTIONS_CONFIG=<yaml> yarn process-collections:base` | Configure collections on Base |

---

## Troubleshooting

### "NftPool address not found"

The script looks for NftPool address in this order:
1. `infrastructure.yaml` in same folder as collections
2. `ignition/deployments/chain-{chainId}/infrastructure.json`

Make sure Step 2 (deploy infrastructure) completed successfully and always pass `INFRA_CONFIG` explicitly.

### VRF callback not received

1. Verify PackManager is added as VRF consumer at [vrf.chain.link](https://vrf.chain.link/)
2. Check VRF subscription has sufficient LINK balance
3. Verify `callbackGasLimit` in config (default: 500000)

### "execution reverted" on pack opening

1. Ensure BURNER_ROLE is granted to PackManager on RariPack
2. Verify collections are configured in NftPool
3. Check pool has NFTs at required levels

### Nonce errors

Scripts use manual nonce management. If you see nonce errors:
1. Wait for pending transactions to confirm
2. Run the script again

---

## Chainlink VRF Configuration

### Sepolia Testnet

| Setting | Value |
|---------|-------|
| Coordinator | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` |
| Key Hash | `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae` |
| Subscription ID | Your subscription ID from vrf.chain.link |

### Base Mainnet

| Setting | Value |
|---------|-------|
| Coordinator | `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634` |
| Key Hash | `0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab` |
| Subscription ID | Your subscription ID from vrf.chain.link |

---

## Existing Deployments

### Sepolia Testnet (chainId: 11155111)

| Contract | Address |
|----------|---------|
| RariPack | `0x6A811146A81183393533602DD9fB98E2F66A8d10` |
| NftPool | `0xf1F50d5A9a629Bf663d7c90a83070A36b367C3a1` |
| PackManager | `0x2AB951b1A381938F9671FD77f2cf1e0A418C96C7` |

### Base Mainnet (chainId: 8453)

| Contract | Address |
|----------|---------|
| RariPack | `0x8706480381A0c240Ae1038092350e35b32179124` |
| NftPool | `0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC` |
| PackManager | `0x0048d385d644975d790A4775DF3c3E19b5746EF4` |
