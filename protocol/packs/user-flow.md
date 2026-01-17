# RARI Pack System - User Flow Guide (Base Mainnet)

This guide explains how users interact with the RARI Pack system on Base mainnet.

## 📋 Contract Addresses (Base Mainnet)

### Core Infrastructure

| Contract | Proxy Address | Etherscan |
|----------|---------------|-----------|
| **RariPack** (ERC721) | `0x8706480381A0c240Ae1038092350e35b32179124` | [View on Basescan](https://basescan.org/address/0x8706480381A0c240Ae1038092350e35b32179124) |
| **PackManager** | `0x0048d385d644975d790A4775DF3c3E19b5746EF4` | [View on Basescan](https://basescan.org/address/0x0048d385d644975d790A4775DF3c3E19b5746EF4) |
| **NftPool** | `0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC` | [View on Basescan](https://basescan.org/address/0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC) |

### Implementation Contracts

| Contract | Implementation Address | Etherscan |
|----------|------------------------|-----------|
| RariPack Impl | `0x71a1AA169491ed97288f59e0AAA06D1CB7012c45` | [View on Basescan](https://basescan.org/address/0x71a1AA169491ed97288f59e0AAA06D1CB7012c45) |
| NftPool Impl | `0x20B022C90a5F28132dC80d5dDFaE63B56339a2Fe` | [View on Basescan](https://basescan.org/address/0x20B022C90a5F28132dC80d5dDFaE63B56339a2Fe) |
| PackManager Impl | `0xC2c67742A958D4F2fF4AF6b31D691d4Ed76aEe4e` | [View on Basescan](https://basescan.org/address/0xC2c67742A958D4F2fF4AF6b31D691d4Ed76aEe4e) |

### NFT Collections (Reward Items)

| Rarity | Address | Etherscan |
|--------|---------|-----------|
| Common | `0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E` | [View on Basescan](https://basescan.org/address/0xBa8EA2878F8Fc53066b050DeC69104d86d043A5E) |
| Rare | `0xF87e3783ab9515Ba19cec68C54473366a47721b3` | [View on Basescan](https://basescan.org/address/0xF87e3783ab9515Ba19cec68C54473366a47721b3) |
| Epic | `0x944fF59F65eeb328887E4aa2d97fE478b16a3108` | [View on Basescan](https://basescan.org/address/0x944fF59F65eeb328887E4aa2d97fE478b16a3108) |
| Legendary | `0x75C8b8fe9a2caAFc964c6CBa3BF40688F696E964` | [View on Basescan](https://basescan.org/address/0x75C8b8fe9a2caAFc964c6CBa3BF40688F696E964) |
| Ultra-Rare | `0x7207Fd76ACCabb5f4176d6d47466421271ded8fa` | [View on Basescan](https://basescan.org/address/0x7207Fd76ACCabb5f4176d6d47466421271ded8fa) |

---

## 🎮 User Flow

### 1. Buy a Pack

Users purchase pack NFTs from the `RariPack` contract.

**Contract:** `0x8706480381A0c240Ae1038092350e35b32179124`

**Function:** `mint(PackType packType, address to, uint256 amount)`

**Pack Types:**
| Type | ID | Description |
|------|-----|-------------|
| Bronze | 0 | Entry-level pack with common pool access |
| Silver | 1 | Better odds into the rare pool |
| Gold | 2 | Improved odds across rare and epic pools |
| Platinum | 3 | Best odds with ultra-rare pool access |

**Example (ethers.js):**
```javascript
const rariPack = new ethers.Contract("0x8706480381A0c240Ae1038092350e35b32179124", RariPackABI, signer);

// Get pack price
const price = await rariPack.packPrice(0); // Bronze = 0

// Buy 1 Bronze pack
await rariPack.mint(0, userAddress, 1, { value: price });
```

---

### 2. Open a Pack

After purchasing, users can open their pack to reveal NFT rewards.

**Contract:** `0x0048d385d644975d790A4775DF3c3E19b5746EF4` (PackManager)

**Function:** `openPack(uint256 packTokenId)`

**Process:**
1. User calls `openPack()` with their pack token ID
2. PackManager requests randomness from Chainlink VRF
3. VRF callback selects 3 NFTs based on pack type probabilities
4. NFTs are locked in the pack (revealed on-chain)

**Example:**
```javascript
const packManager = new ethers.Contract("0x0048d385d644975d790A4775DF3c3E19b5746EF4", PackManagerABI, signer);

// Open pack #1
await packManager.openPack(1);

// Wait for VRF callback (usually ~30 seconds to 2 minutes)
// Listen for PackOpened event
```

**Events to Watch:**
- `PackOpenRequested(requestId, requester, packTokenId, packType)` - Opening started
- `PackOpened(requestId, requester, packTokenId, rewards)` - Pack opened successfully
- `PackOpenFailed(requestId, requester, packTokenId, reason)` - Opening failed

---

### 3. View Pack Contents

After opening, users can view the NFTs locked in their pack.

**Contract:** `0x8706480381A0c240Ae1038092350e35b32179124` (RariPack)

**Function:** `getPackContents(uint256 tokenId)`

**Returns:** `(address[] collections, uint256[] tokenIds)`

**Example:**
```javascript
const rariPack = new ethers.Contract("0x8706480381A0c240Ae1038092350e35b32179124", RariPackABI, signer);

const [collections, tokenIds] = await rariPack.getPackContents(1);

// collections[0], tokenIds[0] = First NFT
// collections[1], tokenIds[1] = Second NFT
// collections[2], tokenIds[2] = Third NFT
```

---

### 4. Claim Rewards

Users have two options to claim their rewards:

#### Option A: Claim NFTs

Transfer the actual NFTs to your wallet.

**Contract:** `0x0048d385d644975d790A4775DF3c3E19b5746EF4` (PackManager)

**Function:** `claimNfts(uint256 packTokenId)`

**Example:**
```javascript
const packManager = new ethers.Contract("0x0048d385d644975d790A4775DF3c3E19b5746EF4", PackManagerABI, signer);

// Claim all 3 NFTs from pack #1
await packManager.claimNfts(1);

// NFTs are transferred to your wallet
// Pack token is burned
```

#### Option B: Instant Cash

Trade your NFTs for instant ETH based on floor prices.

**Contract:** `0x0048d385d644975d790A4775DF3c3E19b5746EF4` (PackManager)

**Function:** `claimInstantCash(uint256 packTokenId)`

**Example:**
```javascript
const packManager = new ethers.Contract("0x0048d385d644975d790A4775DF3c3E19b5746EF4", PackManagerABI, signer);

// Get estimated payout
const payout = await packManager.calculateInstantCashPayout(1);
console.log(`Instant cash payout: ${ethers.formatEther(payout)} ETH`);

// Claim instant cash
await packManager.claimInstantCash(1);

// ETH is sent to your wallet
// Pack token is burned
// NFTs return to the pool
```

---

## 📊 Checking Pool Status

### View Pool Level Info

```javascript
const nftPool = new ethers.Contract("0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC", NftPoolABI, signer);

// Pool levels: 0=Common, 1=Rare, 2=Epic, 3=Legendary, 4=UltraRare
const size = await nftPool.getPoolLevelSize(0); // Common pool size
const [lowPrice, highPrice] = await nftPool.getPoolInfo(0); // Price range
```

### View Collection Info

```javascript
const [allowed, floorPrice, poolLevel] = await nftPool.getCollectionInfo(collectionAddress);
```

---

## 🔗 External Dependencies

### Chainlink VRF v2.5 (Base)

| Parameter | Value |
|-----------|-------|
| Coordinator | `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634` |
| Key Hash | `0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab` |
| Subscription ID | `80015873168992726859849382095434323321462670158563823161174109925990052043078` |

---

## ⚠️ Important Notes

1. **Pack Opening Timeout**: If VRF doesn't respond within the timeout period, users can cancel their pending request.

2. **Instant Cash Availability**: Instant cash depends on the PackManager having sufficient ETH balance.

3. **Gas Costs**: Opening packs requires ~500k gas for VRF callback. Claiming requires ~100-200k gas.

4. **Confirmations**: On Base, transactions typically confirm in 2-3 seconds.

---

## 📝 ABI Snippets

### RariPack (Key Functions)
```json
[
  "function mint(uint8 packType, address to, uint256 amount) external payable",
  "function packPrice(uint8 packType) external view returns (uint256)",
  "function getPackContents(uint256 tokenId) external view returns (address[] memory, uint256[] memory)",
  "function isPackOpened(uint256 tokenId) external view returns (bool)"
]
```

### PackManager (Key Functions)
```json
[
  "function openPack(uint256 packTokenId) external",
  "function claimNfts(uint256 packTokenId) external",
  "function claimInstantCash(uint256 packTokenId) external",
  "function calculateInstantCashPayout(uint256 packTokenId) external view returns (uint256)"
]
```

### NftPool (Key Functions)
```json
[
  "function getPoolLevelSize(uint8 level) external view returns (uint256)",
  "function getPoolInfo(uint8 level) external view returns (uint256 lowPrice, uint256 highPrice)",
  "function getCollectionInfo(address collection) external view returns (bool allowed, uint256 floorPrice, uint8 poolLevel)"
]
```

---

## 🔍 Useful Queries

### Check if Pack is Opened
```javascript
const isOpened = await rariPack.isPackOpened(tokenId);
```

### Get Pack Type
```javascript
const packType = await rariPack.getPackType(tokenId);
// 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
```

### Check Treasury Balance (for Instant Cash)
```javascript
const balance = await packManager.treasuryBalance();
console.log(`Available for instant cash: ${ethers.formatEther(balance)} ETH`);
```

---

## 🌐 Links

- **Base Explorer**: https://basescan.org
- **Chainlink VRF Dashboard**: https://vrf.chain.link/base
- **RariPack Contract**: https://basescan.org/address/0x8706480381A0c240Ae1038092350e35b32179124
- **PackManager Contract**: https://basescan.org/address/0x0048d385d644975d790A4775DF3c3E19b5746EF4
- **NftPool Contract**: https://basescan.org/address/0x4Ad4aDbD51e3EBEE4636907f522c4A340fb258AC
