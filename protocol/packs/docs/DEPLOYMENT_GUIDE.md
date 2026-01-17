# Pack System Deployment Guide

Complete guide to deploy the Pack NFT system on **Base** or **Sepolia** networks.

## Overview

The deployment consists of 4 sequential steps:

| Step | Script | Description |
|------|--------|-------------|
| 1 | `1-deploy-items.ts` | Deploy 5 ERC721A NFT collections (Common, Rare, Epic, Legendary, UltraRare) |
| 2 | `2-deploy-infrastructure.ts` | Deploy RariPack, NftPool, PackManager + configure VRF, prices, URIs |
| 3 | `3-mint-items.ts` | Configure collections on NftPool, mint items, deposit into pool |
| 4 | `4-setup-levels.ts` | Verify configuration and show system status |

## Prerequisites

1. **Node.js 18+** and **Yarn**
2. **RPC URL** configured in `hardhat.config.ts` for your target network
3. **Private key** with ETH on target network for gas
4. **Chainlink VRF subscription** funded with LINK ([vrf.chain.link](https://vrf.chain.link/))

## Quick Start

### Option A: Run All Steps

```bash
cd protocol/packs
yarn install

# For Base mainnet
yarn deploy:all:base

# For Sepolia testnet
yarn deploy:all:sepolia
```

### Option B: Run Steps Individually

```bash
cd protocol/packs
yarn install

# For Base mainnet          # For Sepolia testnet
yarn step1:base             yarn step1:sepolia
yarn step2:base             yarn step2:sepolia
yarn step3:base             yarn step3:sepolia
yarn step4:base             yarn step4:sepolia
```

---

## Step-by-Step Guide

### Step 1: Deploy Item Collections

Deploys 5 ERC721A collections for pack items.

```bash
yarn step1:sepolia   # or yarn step1:base
```

**What it does:**
- Deploys 5 `ItemCollection` contracts (ERC721A)
- Each collection has a unique metadata URI
- Owner can mint items to populate the pools

**Environment Variables (optional):**
```env
ITEM_COLLECTION_OWNER=0x...           # Owner address for collections
ITEM_URI_COMMON=https://...           # Metadata URI for Common items
ITEM_URI_RARE=https://...             # Metadata URI for Rare items
ITEM_URI_EPIC=https://...             # Metadata URI for Epic items
ITEM_URI_LEGENDARY=https://...        # Metadata URI for Legendary items
ITEM_URI_ULTRARARE=https://...        # Metadata URI for UltraRare items
```

**Output:**
- `ignition/deployments/chain-{chainId}/item_collections.json`

---

### Step 2: Deploy Pack Infrastructure

Deploys RariPack (pack NFTs), NftPool (item storage), and PackManager (VRF logic).

```bash
yarn step2:sepolia   # or yarn step2:base
```

**What it does:**
- Deploys `RariPack` (ERC-721 pack NFTs) with proxy
- Deploys `NftPool` (holds NFT items) with proxy
- Deploys `PackManager` (VRF + pack opening logic) with proxy
- Grants `BURNER_ROLE` to PackManager on RariPack
- Grants `POOL_MANAGER_ROLE` to PackManager on NftPool
- Configures VRF settings
- Sets pack prices and metadata URIs

**Environment Variables:**
```env
# Required
SEPOLIA_VRF_SUBSCRIPTION_ID=123456    # VRF subscription ID (for Sepolia)
BASE_VRF_SUBSCRIPTION_ID=123456       # VRF subscription ID (for Base)

# Optional
PACK_OWNER=0x...                      # Owner/admin address
PACK_TREASURY=0x...                   # Treasury for pack sales
```

**Output:**
- `ignition/deployments/chain-{chainId}/infrastructure.json`

**⚠️ IMPORTANT:** After this step, add PackManager address as a consumer in your VRF subscription at [vrf.chain.link](https://vrf.chain.link/).

---

### Step 3: Mint & Deposit Items

Configures collections, mints items, and deposits them into NftPool.

```bash
yarn step3:sepolia   # or yarn step3:base
```

**What it does:**
1. **Phase 1**: Configures all collections on NftPool with floor prices
2. **Phase 2**: Mints items to each collection and deposits into NftPool

**Default Mint Amounts (rarity-based distribution):**

| Rarity | Amount | Description |
|--------|--------|-------------|
| Common | 50 | Most plentiful |
| Rare | 30 | Less common |
| Epic | 15 | Moderately rare |
| Legendary | 8 | Very rare |
| Ultra-Rare | 5 | Extremely scarce |

**Total: 108 items**

**Environment Variables (optional):**
```env
MINT_COMMON=50          # Number of common items
MINT_RARE=30            # Number of rare items
MINT_EPIC=15            # Number of epic items
MINT_LEGENDARY=8        # Number of legendary items
MINT_ULTRA_RARE=5       # Number of ultra-rare items
```

**Floor Prices (TEST MODE at ETH=$3300):**

| Rarity | Floor Price | USD Value |
|--------|-------------|-----------|
| Common | 0.000003 ETH | ~1 cent |
| Rare | 0.000006 ETH | ~2 cents |
| Epic | 0.000009 ETH | ~3 cents |
| Legendary | 0.000012 ETH | ~4 cents |
| Ultra-Rare | 0.000015 ETH | ~5 cents |

---

### Step 4: Verify & Status

Verifies the deployment and shows the final system status.

```bash
yarn step4:sepolia   # or yarn step4:base
```

**What it shows:**
- Collection configuration (floor prices, pool levels)
- Pool status (NFT counts per level)
- Pack prices
- Deployed contract addresses
- Usage instructions

---

## Pack Prices (TEST MODE)

| Pack Type | Price (ETH) | USD Value | Available Pools |
|-----------|-------------|-----------|-----------------|
| Bronze | 0.000001 | ~0.3 cent | Common |
| Silver | 0.000002 | ~0.6 cent | Common, Rare |
| Gold | 0.000003 | ~1 cent | Common, Rare, Epic |
| Platinum | 0.000005 | ~1.6 cents | All pools including UltraRare |

---

## Using the Pack System

### 1. Mint a Pack

Users pay ETH to mint pack NFTs:

```solidity
// PackType: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
// Get price first
uint256 price = rariPack.getPackPrice(0); // Bronze

// Mint 1 Bronze pack
rariPack.mintPack{value: price}(userAddress, 0, 1);

// Mint 5 Gold packs
uint256 goldPrice = rariPack.getPackPrice(2);
rariPack.mintPack{value: goldPrice * 5}(userAddress, 2, 5);
```

### 2. Open a Pack

Opening triggers a Chainlink VRF request for randomness:

```solidity
// User must own the pack
packManager.openPack(packTokenId);

// Wait for VRF callback (usually 1-3 blocks)
// Event emitted: PackOpened(packTokenId, owner, nftDetails)
```

### 3. Claim Rewards

After pack is opened, user chooses how to claim:

**Option A: Claim the NFTs**
```solidity
// Transfers all revealed NFTs to the user
packManager.claimNft(packTokenId);
```

**Option B: Claim ETH (Instant Cash)**
```solidity
// Receives 80% of floor prices in ETH
// NFTs stay in pool for future packs
packManager.claimReward(packTokenId);
```

### 4. Check Pack Status

```solidity
// Get pack details
(address owner, uint8 packType, uint8 status, NftInfo[] memory contents) = 
    packManager.getPackInfo(packTokenId);

// Status: 0=Minted, 1=VRF_Pending, 2=Opened

// Get pack price
uint256 price = rariPack.getPackPrice(packType);
```

---

## Frontend Integration Example

```typescript
import { ethers } from "ethers";

// Contract ABIs
const RARI_PACK_ABI = [
  "function mintPack(address to, uint8 packType, uint256 quantity) external payable",
  "function getPackPrice(uint8 packType) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
];

const PACK_MANAGER_ABI = [
  "function openPack(uint256 packTokenId) external",
  "function claimNft(uint256 packTokenId) external",
  "function claimReward(uint256 packTokenId) external",
  "function getPackInfo(uint256 packTokenId) external view returns (tuple(address,uint8,uint8,tuple(address,uint256)[]))",
];

async function mintPack(signer: ethers.Signer, packType: number, quantity: number) {
  const rariPack = new ethers.Contract(RARI_PACK_ADDRESS, RARI_PACK_ABI, signer);
  
  const price = await rariPack.getPackPrice(packType);
  const totalPrice = price * BigInt(quantity);
  
  const tx = await rariPack.mintPack(await signer.getAddress(), packType, quantity, {
    value: totalPrice,
  });
  
  return tx.wait();
}

async function openAndClaim(signer: ethers.Signer, packTokenId: number) {
  const packManager = new ethers.Contract(PACK_MANAGER_ADDRESS, PACK_MANAGER_ABI, signer);
  
  // Open the pack (triggers VRF)
  const openTx = await packManager.openPack(packTokenId);
  await openTx.wait();
  
  // Wait for VRF callback (poll or listen for PackOpened event)
  // ...
  
  // Claim the NFTs
  const claimTx = await packManager.claimNft(packTokenId);
  return claimTx.wait();
}
```

---

## Deployed Addresses

After deployment, addresses are saved to:

```
ignition/deployments/chain-{chainId}/
├── item_collections.json       # Item collection addresses
└── infrastructure.json         # Pack infrastructure addresses
```

**Example `item_collections.json`:**
```json
{
  "common": "0x...",
  "rare": "0x...",
  "epic": "0x...",
  "legendary": "0x...",
  "ultraRare": "0x..."
}
```

**Example `infrastructure.json`:**
```json
{
  "rariPack": "0x...",
  "packManager": "0x...",
  "nftPool": "0x...",
  "implementations": {
    "rariPack": "0x...",
    "nftPool": "0x...",
    "packManager": "0x..."
  }
}
```

---

## Verify Contracts

```bash
# Verify ItemCollection
npx hardhat verify --network sepolia <ADDRESS> \
  "Common Pool Item" "COMMON" "https://..." "<OWNER>"

# Verify implementation contracts
npx hardhat verify --network sepolia <IMPL_ADDRESS>
```

---

## Troubleshooting

### "Collections not found"
Run Step 1 first: `yarn step1:sepolia`

### "Infrastructure not found"
Run Step 2 first: `yarn step2:sepolia`

### VRF callback not received
1. Check PackManager is added as VRF consumer at [vrf.chain.link](https://vrf.chain.link/)
2. Ensure VRF subscription has sufficient LINK balance
3. Verify `vrfCallbackGasLimit` is sufficient (default: 500000)

### "execution reverted" on deposit
Collections must be configured on NftPool before depositing. Step 3 handles this automatically.

### Nonce errors
The scripts use manual nonce management. If you see nonce errors, wait for pending transactions to confirm and try again.

---

## Commands Reference

### Sepolia Testnet (chainId: 11155111)

| Command | Description |
|---------|-------------|
| `yarn step1:sepolia` | Deploy item collections |
| `yarn step2:sepolia` | Deploy pack infrastructure |
| `yarn step3:sepolia` | Configure, mint, and deposit items |
| `yarn step4:sepolia` | Verify and show status |
| `yarn deploy:all:sepolia` | Run all 4 steps sequentially |

### Base Mainnet (chainId: 8453)

| Command | Description |
|---------|-------------|
| `yarn step1:base` | Deploy item collections |
| `yarn step2:base` | Deploy pack infrastructure |
| `yarn step3:base` | Configure, mint, and deposit items |
| `yarn step4:base` | Verify and show status |
| `yarn deploy:all:base` | Run all 4 steps sequentially |

---

## Environment Variables Reference

| Variable | Network | Description |
|----------|---------|-------------|
| `SEPOLIA_VRF_SUBSCRIPTION_ID` | Sepolia | VRF subscription ID |
| `BASE_VRF_SUBSCRIPTION_ID` | Base | VRF subscription ID |
| `VRF_SUBSCRIPTION_ID` | Any | Fallback VRF subscription ID |
| `PACK_OWNER` | Any | Owner address (optional) |
| `PACK_TREASURY` | Any | Treasury address (optional) |
| `MINT_COMMON` | Any | Common items to mint (default: 50) |
| `MINT_RARE` | Any | Rare items to mint (default: 30) |
| `MINT_EPIC` | Any | Epic items to mint (default: 15) |
| `MINT_LEGENDARY` | Any | Legendary items to mint (default: 8) |
| `MINT_ULTRA_RARE` | Any | Ultra-rare items to mint (default: 5) |

---

## File Structure

```
protocol/packs/
├── contracts/
│   ├── ItemCollection.sol          # ERC721A item collection
│   ├── NftPool.sol                 # Pool storage for NFTs
│   ├── PackManager.sol             # VRF + pack opening logic
│   └── RariPack.sol                # Pack NFT (ERC-721)
├── scripts/
│   ├── 1-deploy-items.ts           # Step 1: Deploy collections
│   ├── 2-deploy-infrastructure.ts  # Step 2: Deploy infrastructure
│   ├── 3-mint-items.ts             # Step 3: Configure, mint, deposit
│   └── 4-setup-levels.ts           # Step 4: Verify & status
├── ignition/
│   ├── deployments/                # Deployed addresses per chain
│   ├── modules/                    # Ignition modules (reference)
│   └── parameters/                 # Network-specific parameters
├── metadata/
│   └── base/
│       ├── pack/                   # Pack metadata (bronze, silver, gold)
│       └── item/                   # Item metadata (common, rare, etc.)
└── docs/
    └── DEPLOYMENT_GUIDE.md         # This file
```
