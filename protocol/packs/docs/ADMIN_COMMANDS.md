# RARI Pack System - Admin Commands Reference

Practical commands for setting up and managing the pack infrastructure.

---

## 📋 Prerequisites

```bash
cd /Users/vfadeev/Work/protocol-contracts/protocol/packs
```

Set environment variables:
```bash
export NETWORK=base  # or sepolia
export PRIVATE_KEY=your_private_key
```

---

## 🚀 Initial Infrastructure Setup

### Step 1: Deploy Item Collections

```bash
npx hardhat run scripts/1-deploy-items.ts --network $NETWORK
```

This creates 5 NFT collections (Common, Rare, Epic, Legendary, UltraRare).

### Step 2: Deploy Core Infrastructure

```bash
npx hardhat run scripts/2-deploy-infrastructure.ts --network $NETWORK
```

This deploys:
- RariPack (ERC721 pack tokens)
- NftPool (NFT storage)
- PackManager (VRF + logic)

### Step 3: Mint & Deposit Items

```bash
npx hardhat run scripts/3-mint-items.ts --network $NETWORK
```

### Step 4: Verify Setup

```bash
npx hardhat run scripts/4-setup-levels.ts --network $NETWORK
```

---

## 📦 Add a New Collection

### Option A: Using Hardhat Console

```bash
npx hardhat console --network $NETWORK
```

Then in console:

```javascript
// 1. Get signer and contracts
const [signer] = await ethers.getSigners();

// Load addresses (adjust path for your network)
const infra = require("./ignition/deployments/chain-8453/infrastructure.json");

// Get contract instances
const NftPool = await ethers.getContractFactory("NftPool");
const nftPool = NftPool.attach(infra.nftPool).connect(signer);

// 2. Configure collection with floor price
// This automatically assigns it to the correct pool level based on price
const collectionAddress = "0xYOUR_COLLECTION_ADDRESS";
const floorPrice = ethers.parseEther("0.01"); // 0.01 ETH

const tx = await nftPool.setCollectionFloorPrice(collectionAddress, floorPrice);
await tx.wait();
console.log("Collection configured:", tx.hash);

// 3. Verify configuration
const [allowed, price, level] = await nftPool.getCollectionInfo(collectionAddress);
console.log("Allowed:", allowed);
console.log("Floor Price:", ethers.formatEther(price), "ETH");
console.log("Pool Level:", level); // 0=Common, 1=Rare, 2=Epic, 3=Legendary, 4=UltraRare
```

### Option B: Using a Script

Create `scripts/add-collection.ts`:

```typescript
import { network } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

// Configuration - EDIT THESE
const COLLECTION_ADDRESS = "0xYOUR_COLLECTION_ADDRESS";
const FLOOR_PRICE_ETH = "0.01"; // Floor price in ETH

async function main() {
  const { ethers, networkName } = await network.connect() as any;
  const [signer] = await ethers.getSigners();
  
  // Load infrastructure
  const chainId = networkName === "base" ? 8453 : 11155111;
  const infraPath = path.join(__dirname, "..", "ignition", "deployments", `chain-${chainId}`, "infrastructure.json");
  const infra = JSON.parse(fs.readFileSync(infraPath, "utf-8"));
  
  const NftPool = await ethers.getContractFactory("NftPool");
  const nftPool = NftPool.attach(infra.nftPool).connect(signer);
  
  console.log(`\n📦 Adding collection: ${COLLECTION_ADDRESS}`);
  console.log(`   Floor price: ${FLOOR_PRICE_ETH} ETH`);
  
  const tx = await nftPool.setCollectionFloorPrice(
    COLLECTION_ADDRESS,
    ethers.parseEther(FLOOR_PRICE_ETH)
  );
  await tx.wait();
  
  // Verify
  const [allowed, price, level] = await nftPool.getCollectionInfo(COLLECTION_ADDRESS);
  const levelNames = ["Common", "Rare", "Epic", "Legendary", "UltraRare"];
  
  console.log(`\n✅ Collection configured!`);
  console.log(`   Allowed: ${allowed}`);
  console.log(`   Floor Price: ${ethers.formatEther(price)} ETH`);
  console.log(`   Pool Level: ${levelNames[level]} (${level})`);
  console.log(`   Tx: ${tx.hash}`);
}

main().catch(console.error);
```

Run:
```bash
npx hardhat run scripts/add-collection.ts --network $NETWORK
```

---

## 🎯 Set Pool Level Price Ranges

Pool levels are determined by floor price ranges:

| Level | Name | Default Range |
|-------|------|---------------|
| 0 | Common | 0.001 - 0.01 ETH |
| 1 | Rare | 0.01 - 0.05 ETH |
| 2 | Epic | 0.05 - 0.2 ETH |
| 3 | Legendary | 0.2 - 1 ETH |
| 4 | UltraRare | 1 - 10 ETH |

### Update Pool Level Ranges

```javascript
// In hardhat console
const NftPool = await ethers.getContractFactory("NftPool");
const nftPool = NftPool.attach("0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC").connect(signer);

// Set individual level
// setPoolInfo(level, lowPrice, highPrice)
await nftPool.setPoolInfo(0, ethers.parseEther("0.001"), ethers.parseEther("0.01"));

// Set all levels at once
await nftPool.setAllPoolInfo([
  [ethers.parseEther("0.001"), ethers.parseEther("0.01")],   // Common
  [ethers.parseEther("0.01"), ethers.parseEther("0.05")],    // Rare
  [ethers.parseEther("0.05"), ethers.parseEther("0.2")],     // Epic
  [ethers.parseEther("0.2"), ethers.parseEther("1")],        // Legendary
  [ethers.parseEther("1"), ethers.parseEther("10")]          // UltraRare
]);
```

---

## 🎁 Deposit NFTs to Pool

### Single NFT

```javascript
// Approve first (on the NFT collection contract)
const collection = new ethers.Contract(
  "0xCOLLECTION_ADDRESS",
  ["function approve(address to, uint256 tokenId) external"],
  signer
);
await collection.approve(nftPool.target, tokenId);

// Deposit
await nftPool.deposit("0xCOLLECTION_ADDRESS", tokenId);
```

### Batch Deposit (Approve All First)

```javascript
// Approve all
const collection = new ethers.Contract(
  "0xCOLLECTION_ADDRESS",
  ["function setApprovalForAll(address operator, bool approved) external"],
  signer
);
await collection.setApprovalForAll(nftPool.target, true);

// Deposit multiple
for (let tokenId = 1; tokenId <= 100; tokenId++) {
  await nftPool.deposit("0xCOLLECTION_ADDRESS", tokenId);
}
```

---

## 💰 Set Pack Prices

```javascript
const RariPack = await ethers.getContractFactory("RariPack");
const rariPack = RariPack.attach("0x8706480381A0c240Ae1038092350e35b32179124").connect(signer);

// PackType: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
await rariPack.setPackPrice(0, ethers.parseEther("0.001"));  // Bronze
await rariPack.setPackPrice(1, ethers.parseEther("0.005"));  // Silver
await rariPack.setPackPrice(2, ethers.parseEther("0.01"));   // Gold
await rariPack.setPackPrice(3, ethers.parseEther("0.05"));   // Platinum
```

---

## 🎲 Set Pack Probabilities

Probabilities are cumulative thresholds out of 10000:

```javascript
const PackManager = await ethers.getContractFactory("PackManager");
const packManager = PackManager.attach("0x0048d385d644975d790A4775DF3c3E19b5746EF4").connect(signer);

// setPackProbabilities(packType, ultraRare, legendary, epic, rare)
// Values are CUMULATIVE thresholds
// Example: ultraRare=100 means 1% ultra-rare, legendary=300 means 2% legendary, etc.

// Bronze: mostly common (99%), tiny chance of rare
await packManager.setPackProbabilities(0, 1, 5, 20, 100);
// Means: 0.01% ultra-rare, 0.04% legendary, 0.15% epic, 0.8% rare, 99% common

// Silver: better odds
await packManager.setPackProbabilities(1, 20, 100, 500, 2000);

// Gold: even better
await packManager.setPackProbabilities(2, 100, 500, 1500, 4000);

// Platinum: best odds
await packManager.setPackProbabilities(3, 500, 1500, 3500, 6000);
```

---

## 🔐 Grant Roles

### Grant POOL_MANAGER_ROLE to PackManager

```javascript
const nftPool = NftPool.attach(infra.nftPool).connect(signer);
const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
await nftPool.grantRole(POOL_MANAGER_ROLE, infra.packManager);
```

### Grant BURNER_ROLE to PackManager

```javascript
const rariPack = RariPack.attach(infra.rariPack).connect(signer);
const BURNER_ROLE = await rariPack.BURNER_ROLE();
await rariPack.grantRole(BURNER_ROLE, infra.packManager);
```

---

## ⚙️ Configure VRF (Chainlink)

### Base Mainnet

```javascript
await packManager.setVrfConfig(
  "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",  // Coordinator
  "0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab",  // Key Hash
  "80015873168992726859849382095434323321462670158563823161174109925990052043078",  // Subscription ID
  500000,   // Callback gas limit
  3         // Confirmations
);

// Use native ETH for VRF payment
await packManager.setVrfPayWithLink(false);
```

### Sepolia Testnet

```javascript
await packManager.setVrfConfig(
  "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",  // Coordinator
  "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",  // Key Hash
  "31234815417281375020060825130305937433281857209550563487914138707724720747173",  // Subscription ID
  500000,
  3
);
```

---

## 💵 Configure Treasury

```javascript
// Set RariPack treasury (where pack sales go)
await rariPack.setTreasury(packManager.target); // Send to PackManager for instant cash

// Set payout treasury (where excess ETH goes)
await packManager.setPayoutTreasury(ownerAddress);

// Set auto-forward threshold
await packManager.setTreasuryThreshold(ethers.parseEther("5")); // Forward above 5 ETH

// Enable instant cash
await packManager.setInstantCashEnabled(true);
```

---

## 🖼️ Set Metadata URIs

### Pack Images

```javascript
const baseUrl = "https://rarible-drops.s3.filebase.com/Base/pack";
await rariPack.setPackURI(0, `${baseUrl}/bronze.png`);
await rariPack.setPackURI(1, `${baseUrl}/silver.png`);
await rariPack.setPackURI(2, `${baseUrl}/gold.png`);
await rariPack.setPackURI(3, `${baseUrl}/platinum.png`);
```

### Collection Base URIs

```javascript
const ItemCollection = await ethers.getContractFactory("ItemCollection");

const collections = {
  common: "0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E",
  rare: "0xF87e3783ab9515Ba19cec68C54473366a47721b3",
  epic: "0x944fF59F65eeb328887E4aa2d97fE478b16a3108",
  legendary: "0x75C8b8fe9a2caAFc964c6CBa3BF40688F696E964",
  ultraRare: "0x7207Fd76ACCabb5f4176d6d47466421271ded8fa"
};

const baseUrl = "https://rarible-drops.s3.filebase.com/Base/pack/item";

for (const [name, address] of Object.entries(collections)) {
  const collection = ItemCollection.attach(address).connect(signer);
  const uri = name === "ultraRare" ? `${baseUrl}/ultra-rare/` : `${baseUrl}/${name}/`;
  await collection.setBaseURI(uri);
  console.log(`Set ${name} URI: ${uri}`);
}
```

---

## 📊 Check Current State

### Pool Levels

```javascript
for (let i = 0; i < 5; i++) {
  const [low, high] = await nftPool.getPoolInfo(i);
  const size = await nftPool.getPoolLevelSize(i);
  console.log(`Level ${i}: ${ethers.formatEther(low)} - ${ethers.formatEther(high)} ETH, ${size} NFTs`);
}
```

### Collection Info

```javascript
const [allowed, price, level] = await nftPool.getCollectionInfo(collectionAddress);
console.log("Allowed:", allowed);
console.log("Floor:", ethers.formatEther(price), "ETH");
console.log("Level:", level);
```

### Pack Prices

```javascript
const types = ["Bronze", "Silver", "Gold", "Platinum"];
for (let i = 0; i < 4; i++) {
  const price = await rariPack.packPrice(i);
  console.log(`${types[i]}: ${ethers.formatEther(price)} ETH`);
}
```

### Role Checks

```javascript
const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
const BURNER_ROLE = await rariPack.BURNER_ROLE();

console.log("PackManager has POOL_MANAGER_ROLE:", await nftPool.hasRole(POOL_MANAGER_ROLE, packManager.target));
console.log("PackManager has BURNER_ROLE:", await rariPack.hasRole(BURNER_ROLE, packManager.target));
```

---

## 🆘 Emergency Commands

### Pause System

```javascript
await packManager.pause();
```

### Unpause System

```javascript
await packManager.unpause();
```

### Withdraw Funds

```javascript
const balance = await ethers.provider.getBalance(packManager.target);
await packManager.withdrawTreasury(ownerAddress, balance);
```

### Rescue Stuck NFT

```javascript
await nftPool.rescueNft(collectionAddress, recipientAddress, tokenId);
```

---

## 📁 Contract Addresses

### Base Mainnet (Chain ID: 8453)

| Contract | Address |
|----------|---------|
| RariPack | `0x8706480381A0c240Ae1038092350e35b32179124` |
| PackManager | `0x0048d385d644975d790A4775DF3c3E19b5746EF4` |
| NftPool | `0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC` |
| Common | `0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E` |
| Rare | `0xF87e3783ab9515Ba19cec68C54473366a47721b3` |
| Epic | `0x944fF59F65eeb328887E4aa2d97fE478b16a3108` |
| Legendary | `0x75C8b8fe9a2caAFc964c6CBa3BF40688F696E964` |
| UltraRare | `0x7207Fd76ACCabb5f4176d6d47466421271ded8fa` |

### Sepolia Testnet (Chain ID: 11155111)

Check `ignition/deployments/chain-11155111/infrastructure.json`
