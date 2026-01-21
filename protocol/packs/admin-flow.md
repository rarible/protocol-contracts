# RARI Pack System - Admin Flow Guide (Base Mainnet)

This guide documents administrative functions for managing the RARI Pack system.

## 📋 Contract Addresses (Base Mainnet)

### Core Infrastructure

| Contract | Proxy Address | Basescan |
|----------|---------------|----------|
| **RariPack** | `0x8706480381A0c240Ae1038092350e35b32179124` | [View](https://basescan.org/address/0x8706480381A0c240Ae1038092350e35b32179124) |
| **PackManager** | `0x0048d385d644975d790A4775DF3c3E19b5746EF4` | [View](https://basescan.org/address/0x0048d385d644975d790A4775DF3c3E19b5746EF4) |
| **NftPool** | `0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC` | [View](https://basescan.org/address/0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC) |

### NFT Collections

| Rarity | Address | Basescan |
|--------|---------|----------|
| Common | `0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E` | [View](https://basescan.org/address/0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E) |
| Rare | `0xF87e3783ab9515Ba19cec68C54473366a47721b3` | [View](https://basescan.org/address/0xF87e3783ab9515Ba19cec68C54473366a47721b3) |
| Epic | `0x944fF59F65eeb328887E4aa2d97fE478b16a3108` | [View](https://basescan.org/address/0x944fF59F65eeb328887E4aa2d97fE478b16a3108) |
| Legendary | `0x75C8b8fe9a2caAFc964c6CBa3BF40688F696E964` | [View](https://basescan.org/address/0x75C8b8fe9a2caAFc964c6CBa3BF40688F696E964) |
| UltraRare | `0x7207Fd76ACCabb5f4176d6d47466421271ded8fa` | [View](https://basescan.org/address/0x7207Fd76ACCabb5f4176d6d47466421271ded8fa) |

---

## 🔑 Role-Based Access

### RariPack Roles

| Role | Hash | Permissions |
|------|------|-------------|
| `DEFAULT_ADMIN_ROLE` | `0x00` | Set prices, URIs, descriptions, treasury |
| `BURNER_ROLE` | `keccak256("BURNER_ROLE")` | Burn packs, set pack contents |

### NftPool Roles

| Role | Hash | Permissions |
|------|------|-------------|
| `DEFAULT_ADMIN_ROLE` | `0x00` | Full admin access |
| `POOL_MANAGER_ROLE` | `keccak256("POOL_MANAGER_ROLE")` | Configure collections, transfer NFTs |

### PackManager

| Role | Permissions |
|------|-------------|
| `owner()` | All admin functions |

---

## 📦 RariPack Admin Functions

### Set Pack Price

```javascript
const rariPack = new ethers.Contract(
  "0x8706480381A0c240Ae1038092350e35b32179124",
  ["function setPackPrice(uint8 packType, uint256 newPrice) external"],
  signer
);

// PackType: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
// Price in wei
await rariPack.setPackPrice(0, ethers.parseEther("0.001")); // Bronze = 0.001 ETH
await rariPack.setPackPrice(1, ethers.parseEther("0.005")); // Silver = 0.005 ETH
await rariPack.setPackPrice(2, ethers.parseEther("0.01"));  // Gold = 0.01 ETH
await rariPack.setPackPrice(3, ethers.parseEther("0.05"));  // Platinum = 0.05 ETH
```

### Set Pack URI (Image)

```javascript
const rariPack = new ethers.Contract(
  "0x8706480381A0c240Ae1038092350e35b32179124",
  ["function setPackURI(uint8 packType, string newURI) external"],
  signer
);

const baseUrl = "https://rarible-drops.s3.filebase.com/Base/pack";
await rariPack.setPackURI(0, `${baseUrl}/bronze.png`);
await rariPack.setPackURI(1, `${baseUrl}/silver.png`);
await rariPack.setPackURI(2, `${baseUrl}/gold.png`);
await rariPack.setPackURI(3, `${baseUrl}/platinum.png`);
```

### Set Pack Description

```javascript
const rariPack = new ethers.Contract(
  "0x8706480381A0c240Ae1038092350e35b32179124",
  ["function setPackDescription(uint8 packType, string description) external"],
  signer
);

await rariPack.setPackDescription(0, "Bronze pack for entry-level pulls from the common pool.");
await rariPack.setPackDescription(1, "Silver pack with better odds for rare items.");
await rariPack.setPackDescription(2, "Gold pack with access to epic tier items.");
await rariPack.setPackDescription(3, "Platinum pack for ultra-rare and legendary pulls.");
```

### Set Treasury (Sales Revenue)

```javascript
const rariPack = new ethers.Contract(
  "0x8706480381A0c240Ae1038092350e35b32179124",
  ["function setTreasury(address newTreasury) external"],
  signer
);

// Set where pack sale ETH goes (should be PackManager for instant cash)
await rariPack.setTreasury("0x0048d385d644975d790A4775DF3c3E19b5746EF4");
```

### Grant/Revoke Roles

```javascript
const rariPack = new ethers.Contract(
  "0x8706480381A0c240Ae1038092350e35b32179124",
  [
    "function grantRole(bytes32 role, address account) external",
    "function revokeRole(bytes32 role, address account) external",
    "function BURNER_ROLE() view returns (bytes32)"
  ],
  signer
);

const BURNER_ROLE = await rariPack.BURNER_ROLE();
await rariPack.grantRole(BURNER_ROLE, packManagerAddress);
```

---

## 🎯 PackManager Admin Functions

### Configure VRF

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  [
    "function setVrfConfig(address coordinator_, bytes32 keyHash_, uint256 subscriptionId_, uint32 callbackGasLimit_, uint16 requestConfirmations_) external",
    "function setVrfPayWithLink(bool payWithLink_) external"
  ],
  signer
);

// Base VRF Config
await packManager.setVrfConfig(
  "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",  // Coordinator
  "0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab",  // Key Hash
  "80015873168992726859849382095434323321462670158563823161174109925990052043078",  // Sub ID
  500000,   // Callback gas limit
  3         // Confirmations
);

// Pay with native ETH (false) or LINK (true)
await packManager.setVrfPayWithLink(false);
```

### Set Pack Probabilities

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  [
    "function setPackProbabilities(uint8 packType, uint16 ultraRare, uint16 legendary, uint16 epic, uint16 rare) external",
    "function setAllPackProbabilities((uint16,uint16,uint16,uint16) platinum, (uint16,uint16,uint16,uint16) gold, (uint16,uint16,uint16,uint16) silver, (uint16,uint16,uint16,uint16) bronze) external"
  ],
  signer
);

// Probabilities are cumulative thresholds out of 10000
// Example: Bronze pack = 99% common, 0.8% rare, 0.15% epic, 0.04% legendary, 0.01% ultra-rare
// ultraRare < legendary < epic < rare < 10000

// Set individual pack type
await packManager.setPackProbabilities(
  0,      // Bronze
  1,      // ultraRare threshold (0.01%)
  5,      // legendary threshold (0.04%)
  20,     // epic threshold (0.15%)
  100     // rare threshold (0.8%)
);

// Set all at once
await packManager.setAllPackProbabilities(
  { ultraRare: 500, legendary: 1500, epic: 3500, rare: 6000 },   // Platinum
  { ultraRare: 100, legendary: 500, epic: 1500, rare: 4000 },    // Gold
  { ultraRare: 20, legendary: 100, epic: 500, rare: 2000 },      // Silver
  { ultraRare: 1, legendary: 5, epic: 20, rare: 100 }            // Bronze
);
```

### Treasury Management

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  [
    "function setPayoutTreasury(address treasury_) external",
    "function setTreasuryThreshold(uint256 threshold_) external",
    "function withdrawTreasury(address to, uint256 amount) external"
  ],
  signer
);

// Set where excess ETH goes
await packManager.setPayoutTreasury(ownerAddress);

// Set auto-forward threshold (excess above this sent to payoutTreasury)
await packManager.setTreasuryThreshold(ethers.parseEther("5")); // 5 ETH

// Withdraw funds
await packManager.withdrawTreasury(ownerAddress, ethers.parseEther("1"));
```

### Enable/Disable Instant Cash

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  ["function setInstantCashEnabled(bool enabled) external"],
  signer
);

await packManager.setInstantCashEnabled(true);  // Enable
await packManager.setInstantCashEnabled(false); // Disable
```

### Pause/Unpause

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  [
    "function pause() external",
    "function unpause() external"
  ],
  signer
);

await packManager.pause();   // Emergency stop
await packManager.unpause(); // Resume operations
```

### Set VRF Timeout

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  ["function setVrfRequestTimeout(uint64 timeoutSeconds) external"],
  signer
);

// Set timeout for stuck VRF requests (default: 1 hour)
await packManager.setVrfRequestTimeout(3600);
```

### Admin Open Pack (Manual VRF Trigger)

```javascript
const packManager = new ethers.Contract(
  "0x0048d385d644975d790A4775DF3c3E19b5746EF4",
  ["function adminOpenPack(uint256 packTokenId) external returns (uint256)"],
  signer
);

// Manually trigger VRF for a stuck pack
const requestId = await packManager.adminOpenPack(tokenId);
```

---

## 🏊 NftPool Admin Functions

### Configure Pool Levels (Price Ranges)

```javascript
const nftPool = new ethers.Contract(
  "0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC",
  [
    "function setPoolInfo(uint8 level, uint256 lowPrice, uint256 highPrice) external",
    "function setAllPoolInfo((uint256,uint256)[] ranges) external"
  ],
  signer
);

// PoolLevel: 0=Common, 1=Rare, 2=Epic, 3=Legendary, 4=UltraRare
// Set individual level
await nftPool.setPoolInfo(0, ethers.parseEther("0.001"), ethers.parseEther("0.01")); // Common

// Set all levels at once
await nftPool.setAllPoolInfo([
  { lowPrice: ethers.parseEther("0.001"), highPrice: ethers.parseEther("0.01") },   // Common
  { lowPrice: ethers.parseEther("0.01"), highPrice: ethers.parseEther("0.05") },    // Rare
  { lowPrice: ethers.parseEther("0.05"), highPrice: ethers.parseEther("0.2") },     // Epic
  { lowPrice: ethers.parseEther("0.2"), highPrice: ethers.parseEther("1") },        // Legendary
  { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("10") }          // UltraRare
]);
```

### Configure Collections

```javascript
const nftPool = new ethers.Contract(
  "0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC",
  [
    "function setCollectionFloorPrice(address collection, uint256 newPrice) external",
    "function setCollectionFloorPrices(address[] collections, uint256[] floorPrices) external",
    "function configureCollections(address[] collections, bool[] allowedList, uint256[] floorPrices) external"
  ],
  signer
);

// Set single collection floor price
await nftPool.setCollectionFloorPrice(collectionAddress, ethers.parseEther("0.005"));

// Batch update floor prices
await nftPool.setCollectionFloorPrices(
  [collection1, collection2, collection3],
  [ethers.parseEther("0.005"), ethers.parseEther("0.02"), ethers.parseEther("0.1")]
);

// Full collection configuration
await nftPool.configureCollections(
  [collection1, collection2],
  [true, true],  // allowed
  [ethers.parseEther("0.005"), ethers.parseEther("0.02")]
);
```

### Grant Pool Manager Role

```javascript
const nftPool = new ethers.Contract(
  "0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC",
  [
    "function grantRole(bytes32 role, address account) external",
    "function POOL_MANAGER_ROLE() view returns (bytes32)"
  ],
  signer
);

const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
await nftPool.grantRole(POOL_MANAGER_ROLE, packManagerAddress);
```

### Rescue Stuck NFTs

```javascript
const nftPool = new ethers.Contract(
  "0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC",
  ["function rescueNft(address collection, address to, uint256 tokenId) external"],
  signer
);

// Rescue an NFT that was sent incorrectly
await nftPool.rescueNft(collectionAddress, recipientAddress, tokenId);
```

---

## 🎨 ItemCollection Admin Functions

### Mint NFTs

```javascript
const collection = new ethers.Contract(
  "0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E", // Common collection
  [
    "function mint(address to) external",
    "function mintBatch(address to, uint256 quantity) external"
  ],
  signer
);

// Mint single
await collection.mint(recipientAddress);

// Mint batch
await collection.mintBatch(recipientAddress, 100);
```

### Set Base URI

```javascript
const collection = new ethers.Contract(
  "0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E",
  ["function setBaseURI(string newBaseURI) external"],
  signer
);

await collection.setBaseURI("https://rarible-drops.s3.filebase.com/Base/pack/item/common/");
```

---

## 📊 Read Functions (View State)

### Check Current Configuration

```javascript
// RariPack
const price = await rariPack.packPrice(0); // Bronze price
const uri = await rariPack.packURI(0);
const desc = await rariPack.packDescription(0);
const treasury = await rariPack.treasury();

// PackManager
const vrfConfig = await packManager.vrfCoordinator();
const vrfPayWithLink = await packManager.vrfPayWithLink();
const instantCashEnabled = await packManager.instantCashEnabled();
const treasuryThreshold = await packManager.treasuryThreshold();
const paused = await packManager.paused();

// NftPool
const [lowPrice, highPrice] = await nftPool.getPoolInfo(0); // Common level
const poolSize = await nftPool.getPoolLevelSize(0);
const [allowed, floorPrice, level] = await nftPool.getCollectionInfo(collectionAddress);
```

### Check Roles

```javascript
const hasRole = await rariPack.hasRole(BURNER_ROLE, packManagerAddress);
const hasPoolRole = await nftPool.hasRole(POOL_MANAGER_ROLE, packManagerAddress);
const owner = await packManager.owner();
```

---

## 🔧 Common Admin Tasks

### 1. Add New Collection to Pool

```javascript
// 1. Deploy new ItemCollection (or use existing ERC721)
// 2. Mint NFTs
await collection.mintBatch(signerAddress, 100);

// 3. Approve NftPool
await collection.setApprovalForAll(nftPoolAddress, true);

// 4. Configure collection on NftPool
await nftPool.setCollectionFloorPrice(collectionAddress, ethers.parseEther("0.01"));

// 5. Deposit NFTs
for (let i = 1; i <= 100; i++) {
  await nftPool.deposit(collectionAddress, i);
}
```

### 2. Update Pack Prices

```javascript
// Get current prices
for (let i = 0; i < 4; i++) {
  const price = await rariPack.packPrice(i);
  console.log(`Pack ${i}: ${ethers.formatEther(price)} ETH`);
}

// Update prices
await rariPack.setPackPrice(0, ethers.parseEther("0.002")); // Bronze
await rariPack.setPackPrice(1, ethers.parseEther("0.01"));  // Silver
await rariPack.setPackPrice(2, ethers.parseEther("0.02"));  // Gold
await rariPack.setPackPrice(3, ethers.parseEther("0.1"));   // Platinum
```

### 3. Emergency Pause

```javascript
// Pause all operations
await packManager.pause();

// Check status
const isPaused = await packManager.paused();
console.log("Paused:", isPaused);

// Resume when ready
await packManager.unpause();
```

### 4. Withdraw Revenue

```javascript
// Check balance
const balance = await ethers.provider.getBalance(packManagerAddress);
console.log("PackManager balance:", ethers.formatEther(balance), "ETH");

// Withdraw to owner
await packManager.withdrawTreasury(ownerAddress, balance);
```

---

## 🔗 Useful Links

- [RariPack Contract](https://basescan.org/address/0x8706480381A0c240Ae1038092350e35b32179124#writeProxyContract)
- [PackManager Contract](https://basescan.org/address/0x0048d385d644975d790A4775DF3c3E19b5746EF4#writeProxyContract)
- [NftPool Contract](https://basescan.org/address/0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC#writeProxyContract)
- [Chainlink VRF Dashboard](https://vrf.chain.link/base)

---

## 📝 ABI Reference

### RariPack (Admin Functions)

```json
[
  "function setPackPrice(uint8 packType, uint256 newPrice) external",
  "function setPackURI(uint8 packType, string newURI) external",
  "function setPackDescription(uint8 packType, string description) external",
  "function setTreasury(address newTreasury) external",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function BURNER_ROLE() view returns (bytes32)"
]
```

### PackManager (Admin Functions)

```json
[
  "function setVrfConfig(address coordinator_, bytes32 keyHash_, uint256 subscriptionId_, uint32 callbackGasLimit_, uint16 requestConfirmations_) external",
  "function setVrfPayWithLink(bool payWithLink_) external",
  "function setPackProbabilities(uint8 packType, uint16 ultraRare, uint16 legendary, uint16 epic, uint16 rare) external",
  "function setPayoutTreasury(address treasury_) external",
  "function setTreasuryThreshold(uint256 threshold_) external",
  "function setInstantCashEnabled(bool enabled) external",
  "function setVrfRequestTimeout(uint64 timeoutSeconds) external",
  "function pause() external",
  "function unpause() external",
  "function withdrawTreasury(address to, uint256 amount) external",
  "function adminOpenPack(uint256 packTokenId) external returns (uint256)"
]
```

### NftPool (Admin Functions)

```json
[
  "function setPoolInfo(uint8 level, uint256 lowPrice, uint256 highPrice) external",
  "function setAllPoolInfo((uint256,uint256)[] ranges) external",
  "function setCollectionFloorPrice(address collection, uint256 newPrice) external",
  "function setCollectionFloorPrices(address[] collections, uint256[] floorPrices) external",
  "function configureCollections(address[] collections, bool[] allowedList, uint256[] floorPrices) external",
  "function grantRole(bytes32 role, address account) external",
  "function rescueNft(address collection, address to, uint256 tokenId) external",
  "function POOL_MANAGER_ROLE() view returns (bytes32)"
]
```

### ItemCollection (Admin Functions)

```json
[
  "function mint(address to) external",
  "function mintBatch(address to, uint256 quantity) external",
  "function setBaseURI(string newBaseURI) external"
]
```
