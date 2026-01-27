# RARI Pack System - Admin Commands Reference

Practical commands for setting up and managing the pack infrastructure.

> **Deployment Guide:** See [YAML_DEPLOYMENT_GUIDE.md](./YAML_DEPLOYMENT_GUIDE.md) for the complete YAML-based deployment workflow.

---

## Prerequisites

```bash
cd /Users/vfadeev/Work/protocol-contracts/protocol/packs
```

Set environment variables:
```bash
export NETWORK=base  # or sepolia
export PRIVATE_KEY=your_private_key
```

---

## Deployment Commands (YAML-Based)

### Deploy RariPack

```bash
RARIPACK_CONFIG=config/raripack.sepolia.yaml yarn deploy:raripack:sepolia
RARIPACK_CONFIG=config/raripack.base.yaml yarn deploy:raripack:base
```

### Deploy Collections

```bash
yarn deploy-collections:sepolia
yarn deploy-collections:base
```

### Deploy NftPool & PackManager

```bash
INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia
INFRA_CONFIG=config/infrastructure.base.yaml yarn deploy:nft-infra:base
```

### Configure Collections in NftPool

```bash
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/YYYY-MM-DD/collections.yaml \
yarn process-collections:sepolia
```

---

## Add a New Collection

### Option A: Using Hardhat Console

```bash
npx hardhat console --network $NETWORK
```

Then in console:

```javascript
// 1. Get signer and contracts
const [signer] = await ethers.getSigners();

// Load addresses (adjust path for your network)
const infra = require("./deployments/sepolia/2026-01-27/infrastructure.yaml");
// Or load from ignition
const infra = require("./ignition/deployments/chain-11155111/infrastructure.json");

// Get contract instances
const NftPool = await ethers.getContractFactory("NftPool");
const nftPool = NftPool.attach(infra.nftPool || infra.contracts.nftPool).connect(signer);

// 2. Configure collection with floor price
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

### Option B: Add to collections.yaml and re-run

Add the collection to your `collections.yaml` file and run:

```bash
INFRA_CONFIG=config/infrastructure.sepolia.yaml \
COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \
yarn process-collections:sepolia
```

---

## Set Pool Level Price Ranges

Pool levels are determined by floor price ranges configured in `infrastructure.yaml`:

```yaml
poolRanges:
  - level: Common
    lowPriceEth: 0
    highPriceEth: 0.05325

  - level: Rare
    lowPriceEth: 0.05325
    highPriceEth: 0.213
    
  # ... etc
```

### Update Pool Level Ranges via Console

```javascript
const NftPool = await ethers.getContractFactory("NftPool");
const nftPool = NftPool.attach("0xNFT_POOL_ADDRESS").connect(signer);

// Set individual level: setPoolInfo(level, lowPrice, highPrice)
await nftPool.setPoolInfo(0, ethers.parseEther("0.001"), ethers.parseEther("0.01"));

// Set all levels at once
await nftPool.setAllPoolInfo([
  [ethers.parseEther("0"), ethers.parseEther("0.05325")],      // Common
  [ethers.parseEther("0.05325"), ethers.parseEther("0.213")],  // Rare
  [ethers.parseEther("0.213"), ethers.parseEther("1.065")],    // Epic
  [ethers.parseEther("1.065"), ethers.parseEther("5.325")],    // Legendary
  [ethers.parseEther("5.325"), ethers.MaxUint256]              // UltraRare
]);
```

---

## Deposit NFTs to Pool

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

### Batch Deposit

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

## Set Pack Prices

Pack prices are configured in `raripack.yaml`:

```yaml
prices:
  bronze: 0.01
  silver: 0.05
  gold: 0.1
  platinum: 0.5
```

### Update via Console

```javascript
const RariPack = await ethers.getContractFactory("RariPack");
const rariPack = RariPack.attach("0xRARI_PACK_ADDRESS").connect(signer);

// PackType: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
await rariPack.setPackPrice(0, ethers.parseEther("0.01"));  // Bronze
await rariPack.setPackPrice(1, ethers.parseEther("0.05"));  // Silver
await rariPack.setPackPrice(2, ethers.parseEther("0.1"));   // Gold
await rariPack.setPackPrice(3, ethers.parseEther("0.5"));   // Platinum
```

---

## Set Pack Probabilities

Probabilities are cumulative thresholds out of 10000, configured in `infrastructure.yaml`:

```yaml
packManager:
  probabilities:
    bronze:
      ultraRare: 0
      legendary: 20
      epic: 120
      rare: 620
    # ... etc
```

### Update via Console

```javascript
const PackManager = await ethers.getContractFactory("PackManager");
const packManager = PackManager.attach("0xPACK_MANAGER_ADDRESS").connect(signer);

// setPackProbabilities(packType, ultraRare, legendary, epic, rare)
// Values are CUMULATIVE thresholds

// Bronze: mostly common
await packManager.setPackProbabilities(0, 0, 20, 120, 620);

// Silver: better odds
await packManager.setPackProbabilities(1, 0, 50, 350, 1350);

// Gold: even better
await packManager.setPackProbabilities(2, 0, 100, 600, 2100);

// Platinum: best odds (includes ultra-rare)
await packManager.setPackProbabilities(3, 50, 250, 950, 2950);
```

---

## Grant Roles

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

### Using cast (CLI)

```bash
# Grant BURNER_ROLE
cast send $RARI_PACK "grantRole(bytes32,address)" \
  $(cast keccak "BURNER_ROLE") $PACK_MANAGER \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

# Grant POOL_MANAGER_ROLE
cast send $NFT_POOL "grantRole(bytes32,address)" \
  $(cast keccak "POOL_MANAGER_ROLE") $PACK_MANAGER \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

---

## Configure VRF (Chainlink)

VRF settings are configured in `infrastructure.yaml`:

```yaml
packManager:
  vrf:
    coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"
    subscriptionId: "YOUR_SUBSCRIPTION_ID"
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"
    callbackGasLimit: 500000
    requestConfirmations: 3
```

### Update via Console

```javascript
// Sepolia
await packManager.setVrfConfig(
  "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",  // Coordinator
  "YOUR_SUBSCRIPTION_ID",                          // Subscription ID
  "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",  // Key Hash
  500000,   // Callback gas limit
  3         // Confirmations
);

// Base Mainnet
await packManager.setVrfConfig(
  "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",
  "YOUR_SUBSCRIPTION_ID",
  "0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab",
  500000,
  3
);
```

---

## Configure Treasury

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

## Set Metadata URIs

### Pack Images

```javascript
const baseUrl = "https://rarible-drops.s3.filebase.com/Base/pack";
await rariPack.setPackURI(0, `${baseUrl}/bronze.png`);
await rariPack.setPackURI(1, `${baseUrl}/silver.png`);
await rariPack.setPackURI(2, `${baseUrl}/gold.png`);
await rariPack.setPackURI(3, `${baseUrl}/platinum.png`);
```

---

## Check Current State

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

## Emergency Commands

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

## Contract Addresses

### Base Mainnet (Chain ID: 8453)

| Contract | Address |
|----------|---------|
| RariPack | `0x8706480381A0c240Ae1038092350e35b32179124` |
| PackManager | `0x0048d385d644975d790A4775DF3c3E19b5746EF4` |
| NftPool | `0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC` |

### Sepolia Testnet (Chain ID: 11155111)

| Contract | Address |
|----------|---------|
| RariPack | `0x6A811146A81183393533602DD9fB98E2F66A8d10` |
| NftPool | `0xf1F50d5A9a629Bf663d7c90a83070A36b367C3a1` |
| PackManager | `0x2AB951b1A381938F9671FD77f2cf1e0A418C96C7` |

---

## Useful Links

- [Chainlink VRF Dashboard](https://vrf.chain.link/)
- [Base Block Explorer](https://basescan.org/)
- [Sepolia Block Explorer](https://sepolia.etherscan.io/)
- [Chainlink VRF Docs](https://docs.chain.link/vrf/v2-5/supported-networks)
