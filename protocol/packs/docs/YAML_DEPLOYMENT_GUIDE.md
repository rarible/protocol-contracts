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
│  0a. DEPLOY RARIPACK (if not deployed)                                      │
│      ┌─────────────────────┐                                                │
│      │ raripack.yaml       │ ──────► deploy-raripack ──► raripack.yaml      │
│      │ (owner, prices)     │         (deployed addresses)                   │
│      └─────────────────────┘                                                │
│                                                                             │
│  0b. SET UP VRF SUBSCRIPTION                                                │
│      ┌─────────────────────┐                                                │
│      │ vrf.chain.link      │ ──────► subscription ID + fund with LINK       │
│      └─────────────────────┘                                                │
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
│  3. POST-DEPLOYMENT SETUP                                                   │
│     - Add PackManager to VRF subscription at vrf.chain.link                 │
│     - Grant BURNER_ROLE to PackManager on RariPack                          │
│                                                                             │
│  4. CONFIGURE COLLECTIONS                                                   │
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
4. **LINK tokens** for VRF subscription funding

---

## Step 0a: Deploy NftPack (RariPack)

Before deploying the infrastructure, you need to deploy the RariPack contract which is the ERC721 pack NFT.

### Configuration File

Create or edit `config/raripack.sepolia.yaml`:

```yaml
# Network identification
network: sepolia
chainId: "11155111"

# Contract settings
owner: "0xYOUR_OWNER_ADDRESS"
treasury: "0xYOUR_TREASURY_ADDRESS"
name: "Rari Pack"
symbol: "RPACK"

# Pack prices in ETH
prices:
  bronze: 0.01
  silver: 0.05
  gold: 0.1
  platinum: 0.5

# Pack metadata URIs (IPFS or HTTPS)
uris:
  bronze: "ipfs://QmBronzePackImage"
  silver: "ipfs://QmSilverPackImage"
  gold: "ipfs://QmGoldPackImage"
  platinum: "ipfs://QmPlatinumPackImage"

# Pack descriptions (optional)
descriptions:
  bronze: "Bronze pack for entry-level pulls from the common pool."
  silver: "Silver pack with better chances into the rare pool."
  gold: "Gold pack offering improved odds across rare and epic pools."
  platinum: "Platinum pack with the best odds and access to the ultra-rare pool."
```

### Command

```bash
cd protocol/packs

# Deploy RariPack using YAML config
RARIPACK_CONFIG=config/raripack.sepolia.yaml yarn deploy:raripack:sepolia
```

### What it does

1. **Deploys RariPack** (implementation + TransparentUpgradeableProxy)
   - Initialized with owner, treasury, name, and symbol
2. **Configures pack prices** for all 4 pack types
3. **Sets pack URIs** for metadata images
4. **Sets pack descriptions** (if provided)
5. **Outputs deployment info** to `deployments/<network>/<date>/raripack.yaml`

### Configuration Reference

| Field | Required | Description |
|-------|----------|-------------|
| `network` | Yes | Network name (sepolia, base, etc.) |
| `chainId` | Yes | Chain ID as string |
| `owner` | Yes | Address that receives DEFAULT_ADMIN_ROLE and BURNER_ROLE |
| `treasury` | Yes | Address that receives ETH from pack sales |
| `name` | No | ERC721 token name (default: "Rari Pack") |
| `symbol` | No | ERC721 token symbol (default: "RPACK") |
| `prices` | Yes | Pack prices in ETH for bronze, silver, gold, platinum |
| `uris` | No | IPFS or HTTPS URIs for pack images |
| `descriptions` | No | Human-readable descriptions per pack type |

### Output

```
deployments/<network>/<date>/raripack.yaml
```

**Example output `raripack.yaml`:**

```yaml
network: sepolia
chainId: "11155111"
deployedAt: "2026-01-27T12:00:00.000Z"

contracts:
  rariPack: "0x6A811146A81183393533602DD9fB98E2F66A8d10"

implementations:
  rariPack: "0x1234567890123456789012345678901234567890"

configuration:
  owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f"
  treasury: "0xa95a09520af0f1bbef810a47560c79affe75aa9f"
  prices:
    bronze: "0.01"
    silver: "0.05"
    gold: "0.1"
    platinum: "0.5"
```

Use the `rariPack` address from this output in your `infrastructure.yaml` file.

---

## Step 0b: Set Up Chainlink VRF

The pack system uses Chainlink VRF v2.5 for provably fair randomness when opening packs.

### 1. Create VRF Subscription

1. Go to [vrf.chain.link](https://vrf.chain.link/)
2. Connect your wallet (must be the subscription owner)
3. Click **"Create Subscription"**
4. Confirm the transaction
5. **Copy your Subscription ID** - you'll need this for the infrastructure YAML

### 2. Fund the Subscription with LINK

VRF requests consume LINK tokens. Fund your subscription:

1. On the VRF dashboard, select your subscription
2. Click **"Fund Subscription"**
3. Enter the amount of LINK to deposit:
   - **Testnet (Sepolia)**: 5-10 LINK for testing
   - **Mainnet**: Start with 10-50 LINK depending on expected volume
4. Confirm the transaction

**Get testnet LINK:**
- Sepolia: [faucets.chain.link](https://faucets.chain.link/sepolia)

### 3. Note VRF Configuration Values

After creating the subscription, gather these values for your infrastructure YAML:

| Setting | How to Find |
|---------|-------------|
| `subscriptionId` | Shown on your subscription page (large number) |
| `coordinator` | Network-specific address (see table below) |
| `keyHash` | Choose based on gas lane preference (see table below) |

### VRF Coordinator Addresses

| Network | Coordinator Address |
|---------|---------------------|
| Sepolia | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` |
| Base Mainnet | `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634` |
| Ethereum Mainnet | `0xD7f86b4b8Cae7D942340FF628F82735b7a20893a` |

### VRF Key Hashes (Gas Lanes)

**Sepolia:**
| Gas Lane | Key Hash |
|----------|----------|
| 100 gwei | `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae` |

**Base Mainnet:**
| Gas Lane | Key Hash |
|----------|----------|
| 500 gwei | `0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab` |
| 350 gwei | `0x42007c7c0c2ca7e77c8b79ae8b05da2bc42321e6dde59f8fd99c7aca6cc1c2c7` |
| 30 gwei | `0xe55cb0e8e37ffa0d23e9e52e0e5b0c1c2ca99a1ec82ce2b4a26b2bf05b64caf8` |

### 4. Update Infrastructure YAML

Add VRF configuration to your `infrastructure.yaml`:

```yaml
packManager:
  vrf:
    coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"
    subscriptionId: "YOUR_SUBSCRIPTION_ID_HERE"
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"
    callbackGasLimit: 500000
    requestConfirmations: 3
```

### 5. Add PackManager as VRF Consumer (After Deployment)

**Important:** After deploying PackManager, you must add it as a consumer:

1. Go to [vrf.chain.link](https://vrf.chain.link/)
2. Select your subscription
3. Click **"Add Consumer"**
4. Enter the **PackManager proxy address**
5. Confirm the transaction

Without this step, VRF requests will fail with "consumer not registered".

---

## Quick Start

```bash
cd protocol/packs
yarn install

# 0a. Deploy RariPack (if not already deployed)
RARIPACK_CONFIG=config/raripack.sepolia.yaml yarn deploy:raripack:sepolia
# Output: deployments/sepolia/YYYY-MM-DD/raripack.yaml

# 0b. Set up VRF subscription at vrf.chain.link (manual step)

# 1. Deploy test collections (outputs collections.yaml)
yarn deploy-collections:sepolia
# Output: deployments/sepolia/YYYY-MM-DD/collections.yaml

# 2. Deploy NftPool and PackManager (auto-discovers RariPack from step 0a)
INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia
# Output: deployments/sepolia/YYYY-MM-DD/infrastructure.yaml

# 3. Add PackManager to VRF subscription at vrf.chain.link
# 4. Grant BURNER_ROLE to PackManager on RariPack

# 5. Configure collections in NftPool
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

### RariPack Auto-Discovery

The script **automatically discovers** the RariPack address from Step 0a:

1. Checks for `raripack.yaml` in today's deployment folder (`deployments/<network>/YYYY-MM-DD/`)
2. Falls back to `rariPack` address in the infrastructure config
3. If neither found and `rariPack.deploy: true`, deploys a new RariPack

You can also explicitly specify the path:

```bash
RARIPACK_DEPLOY=deployments/sepolia/2026-01-27/raripack.yaml \
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
yarn deploy:nft-infra:sepolia
```

### What it does

1. **Discovers RariPack** from previous deployment (or deploys new if needed)
2. **Deploys NftPool** (implementation + proxy)
   - Initialized with pool price ranges from YAML
3. **Deploys PackManager** (implementation + proxy)
   - Initialized with RariPack address
4. **Configures roles**
   - Grants `POOL_MANAGER_ROLE` to PackManager on NftPool
5. **Configures PackManager**
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

# Step 0a: Deploy RariPack (if not already deployed)
# Edit config/raripack.sepolia.yaml with owner, treasury, prices, URIs
RARIPACK_CONFIG=config/raripack.sepolia.yaml yarn deploy:raripack:sepolia
# Output: deployments/sepolia/2026-01-27/raripack.yaml
# Copy the rariPack address to infrastructure.sepolia.yaml

# Step 0b: Set up VRF subscription
# 1. Go to vrf.chain.link and create subscription
# 2. Fund with 5-10 LINK from faucets.chain.link/sepolia
# 3. Copy subscription ID to infrastructure.sepolia.yaml

# Step 1: Deploy collections
yarn deploy-collections:sepolia
# Output: deployments/sepolia/2026-01-27/collections.yaml

# Step 2: Deploy infrastructure (update rariPack address in YAML first!)
INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia
# Output: deployments/sepolia/2026-01-27/infrastructure.yaml

# Step 3: Add PackManager to VRF subscription at vrf.chain.link
# Step 4: Grant BURNER_ROLE to PackManager on RariPack:
#   cast send $RARI_PACK "grantRole(bytes32,address)" \
#     $(cast keccak "BURNER_ROLE") $PACK_MANAGER \
#     --private-key $PRIVATE_KEY --rpc-url $RPC_URL

# Step 5: Configure collections and deposit NFTs
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \
DEPOSIT_NFTS=true \
yarn process-collections:sepolia
```

### Base Mainnet Deployment

```bash
cd protocol/packs

# Step 0a: Deploy RariPack (if not already deployed)
RARIPACK_CONFIG=config/raripack.base.yaml yarn deploy:raripack:base
# Output: deployments/base/2026-01-27/raripack.yaml

# Step 0b: Set up VRF subscription at vrf.chain.link
# Fund with 10-50 LINK depending on expected volume

# Step 1: Deploy collections (smaller amounts for mainnet)
MINT_COMMON=10 MINT_RARE=8 MINT_EPIC=5 MINT_LEGENDARY=3 MINT_ULTRA_RARE=2 \
yarn deploy-collections:base

# Step 2: Deploy infrastructure
INFRA_CONFIG=config/infrastructure.base.yaml yarn deploy:nft-infra:base

# Step 3: Post-deployment setup
# - Add PackManager to VRF subscription
# - Grant BURNER_ROLE to PackManager on RariPack

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
│   ├── raripack.base.yaml             # RariPack config for Base
│   ├── raripack.sepolia.yaml          # RariPack config for Sepolia
│   ├── infrastructure.base.yaml       # Infrastructure config for Base
│   ├── infrastructure.sepolia.yaml    # Infrastructure config for Sepolia
│   └── collections.example.yaml       # Example collections format
├── deployments/
│   ├── base/
│   │   └── YYYY-MM-DD/
│   │       ├── raripack.yaml          # Deployed RariPack
│   │       ├── collections.yaml       # Deployed collections
│   │       ├── infrastructure.yaml    # Deployed infrastructure
│   │       └── nft-infrastructure.json
│   └── sepolia/
│       └── YYYY-MM-DD/
│           └── ...
├── scripts/
│   ├── deploy-raripack.ts             # Deploy RariPack (YAML-based)
│   ├── deploy-collections.ts          # Deploy & mint collections
│   ├── deploy-nft-infrastructure.ts   # Deploy NftPool & PackManager
│   └── process-collections.ts         # Configure collections in NftPool
└── docs/
    └── YAML_DEPLOYMENT_GUIDE.md       # This file
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `RARIPACK_CONFIG=<yaml> yarn deploy:raripack:sepolia` | Deploy RariPack on Sepolia |
| `RARIPACK_CONFIG=<yaml> yarn deploy:raripack:base` | Deploy RariPack on Base |
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
