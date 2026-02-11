# Live Drops — Technical Specification

> **Version:** 1.0  
> **Network:** Base (mainnet & Sepolia testnet)  
> **Last updated:** 2026-02-11

## Overview

Live Drops is a system of two smart contracts designed for the Base network that enables Live Stream Drop functionality. Each live stream can create a unique NFT collection (drop), allowing viewers to mint NFTs as a form of engagement and support.

### Contracts

1. **LiveDropFactory** — deploys new NFT collections (drops) in a single transaction.
2. **LiveDropCollection (ERC-721)** — an individual NFT collection created by the factory.

### Key Principles

- Contracts are **immutable** (non-upgradeable, no proxies).
- One factory deploys many collections.
- Collection is created in **one transaction** via the factory.
- No deterministic addresses (no CREATE2 required).

---

## Architecture

```
┌─────────────────────┐
│   LiveDropFactory    │
│   (Ownable)          │
│                      │
│ - feeRecipient       │
│ - defaultFeeBps      │    createCollection(config)
│ - defaultFeeFixed*   │ ──────────────────────────►  ┌──────────────────────┐
│ - defaultErc20       │                               │  LiveDropCollection  │
│ - allCollections[]   │                               │  (ERC-721)           │
│ - isCollection{}     │                               │                      │
└─────────────────────┘                               │ - owner (creator)    │
                                                       │ - factory (immutable)│
                                                       │ - fee config         │
                                                       │ - royalty config     │
                                                       │ - on-chain metadata  │
                                                       │ - pausable           │
                                                       └──────────────────────┘
```

---

## LiveDropCollection (ERC-721)

### Base Properties

| Property | Details |
|---|---|
| Standard | OpenZeppelin ERC-721 (v5.x) |
| Token ID | Starts at 0, increments by 1 |
| Batch Mint | Not supported |
| Burn | Allowed by token owner or approved operator |
| `totalSupply()` | Returns total minted count |
| Max Supply | Unlimited (bounded only by `uint256`) |

### Inheritance

```
ERC721, ERC2981, Ownable, Pausable, ReentrancyGuard
```

### Storage

| Variable | Type | Mutability | Description |
|---|---|---|---|
| `factory` | `address` | immutable | Factory contract address |
| `feeRecipient` | `address` | mutable (factory owner only) | Rarible fee recipient |
| `feeBps` | `uint16` | mutable | Fee percentage in basis points |
| `feeFixedNative` | `uint256` | mutable | Fixed fee for native mints |
| `feeFixedErc20` | `uint256` | mutable | Fixed fee for ERC-20 mints |
| `erc20Token` | `address` | mutable | ERC-20 token for payments (default: USDC) |
| `collectionDescription` | `string` | mutable | On-chain collection description |
| `collectionIcon` | `string` | mutable | On-chain collection icon URL/URI |
| `tokenMetaName` | `string` | mutable | Token metadata name (same for all tokens) |
| `tokenMetaDescription` | `string` | mutable | Token metadata description |
| `tokenMetaImage` | `string` | mutable | Token metadata image URL |
| `totalMinted` | `uint256` | auto-incremented | Total minted token counter |

---

## Minting

Minting is **always paid**. Amount must be > 0.

### Native (ETH on Base)

```solidity
function mintNative(address to, uint256 amount) external payable
```

- `to` — NFT recipient address
- `amount` — payment amount (fee deducted from this)
- `msg.value` must be >= `amount`
- Excess (`msg.value - amount`) is refunded to `msg.sender`
- Fee is deducted from `amount`; remainder goes to collection owner

### ERC-20 (default: USDC)

```solidity
function mintErc20(address to, uint256 amount) external
```

- `to` — NFT recipient address
- `amount` — payment amount in token's smallest units (e.g., 6 decimals for USDC)
- Amount is transferred via `SafeERC20.safeTransferFrom`
- Fee is deducted from `amount`; remainder goes to collection owner
- ERC-20 token address is always set (cannot be zero/disabled)
- Token address can be changed by owner or factory owner

---

## Fee System (Rarible Commission)

### Fee Components

| Component | Range | Default | Description |
|---|---|---|---|
| `feeBps` | 0–10000 | 500 (5%) | Percentage fee in basis points |
| `feeFixedNative` | 0–∞ | 0 | Fixed fee for native mints (in wei) |
| `feeFixedErc20` | 0–∞ | 0 | Fixed fee for ERC-20 mints (in token units) |

### Fee Calculation

```
totalFee = (amount * feeBps / 10000) + feeFixed
require(totalFee <= amount)
feeRecipient receives: totalFee
collectionOwner receives: amount - totalFee
```

### Fee Flow

```
Minter pays amount
  ├── totalFee → feeRecipient (Rarible)
  └── remainder → collection owner (creator)
```

### Fee Management

| Action | Who Can Do It |
|---|---|
| Set factory defaults (feeBps, feeFixed*) | Factory owner |
| Set feeRecipient on factory | Factory owner |
| Change feeRecipient on a collection | Factory owner **only** |
| Change feeBps/feeFixed on a collection | Collection owner OR factory owner |

> **Security**: `feeRecipient` on collections can only be changed by the factory owner. This protects Rarible's revenue from being redirected by collection owners.

### Factory Defaults

The factory stores default values. When a new collection is created, it copies:
- `feeRecipient`
- `defaultFeeBps`
- `defaultFeeFixedNative`
- `defaultFeeFixedErc20`
- `defaultErc20`

The factory owner can update these defaults at any time (affects only new collections).

---

## Royalties (ERC-2981)

| Property | Default | Description |
|---|---|---|
| Royalty BPS | 1000 (10%) | Percentage royalty |
| Royalty Receiver | Collection creator | Who receives royalties |

### Royalty Management

| Action | Who Can Do It |
|---|---|
| Set royalty (receiver + bps) | Collection owner OR factory owner |

- Royalty BPS must be <= 10000.

---

## Metadata

### Collection Metadata (on-chain)

| Field | Source | Updatable By |
|---|---|---|
| `name` | ERC721 name (set at deploy) | Immutable |
| `symbol` | ERC721 symbol (set at deploy) | Immutable |
| `description` | `collectionDescription` | Owner or factory owner |
| `icon` | `collectionIcon` | Owner or factory owner |

### `contractURI()`

Returns collection metadata as base64 JSON:
```
data:application/json;base64,<base64({"name":"...","description":"...","image":"..."})>
```

### Token Metadata (on-chain)

- **All tokens share the same metadata** (no per-token metadata).
- Stored on-chain as strings: `tokenMetaName`, `tokenMetaDescription`, `tokenMetaImage`.

### `tokenURI(tokenId)`

- Validates token exists (reverts if not).
- Returns base64 JSON:
```
data:application/json;base64,<base64({"name":"...","description":"...","image":"..."})>
```
- `tokenId` is NOT included in the name.
- Updatable at any time by collection owner or factory owner.

---

## Pause / Unpause

- Collection supports `pause()` and `unpause()`.
- When paused, minting is **disabled** (both native and ERC-20).
- Transfers and burns are NOT affected by pause.

| Action | Who Can Do It |
|---|---|
| Pause | Collection owner OR factory owner |
| Unpause | Collection owner OR factory owner |

---

## Access Control

### Factory

| Role | Capabilities |
|---|---|
| Owner | Manage default fees, fee recipient, default ERC-20, update any collection's fees/royalties/metadata/pause |

### Collection

| Role | Capabilities |
|---|---|
| Owner (creator) | Change fees (bps/fixed), royalties, metadata, ERC-20 token, pause/unpause |
| Factory Owner | All of the above + change `feeRecipient` |

### Modifier: `onlyOwnerOrFactoryOwner`

```solidity
modifier onlyOwnerOrFactoryOwner() {
    require(
        msg.sender == owner() || msg.sender == Ownable(factory).owner(),
        UnauthorizedCaller(msg.sender)
    );
    _;
}
```

---

## Events

### Factory Events

| Event | Parameters |
|---|---|
| `CollectionCreated` | `creator`, `collection`, `name`, `symbol` |
| `DefaultFeesUpdated` | `feeBps`, `feeFixedNative`, `feeFixedErc20` |
| `FeeRecipientUpdated` | `feeRecipient` |
| `DefaultErc20Updated` | `erc20Token` |

### Collection Events

| Event | Parameters |
|---|---|
| `MintedNative` | `to`, `tokenId`, `amount`, `fee` |
| `MintedErc20` | `to`, `tokenId`, `amount`, `fee`, `token` |
| `FeesUpdated` | `feeBps`, `feeFixedNative`, `feeFixedErc20` |
| `FeeRecipientUpdated` | `feeRecipient` |
| `RoyaltyUpdated` | `receiver`, `bps` |
| `Erc20TokenUpdated` | `token` |
| `CollectionMetadataUpdated` | `description`, `icon` |
| `TokenMetadataUpdated` | `name`, `description`, `image` |
| `Paused` / `Unpaused` | (OpenZeppelin built-in) |

---

## Security

- **ReentrancyGuard** on all mint functions.
- **SafeERC20** for all ERC-20 transfers.
- Native ETH refund via `.call{value: ...}("")`; revert if transfer fails.
- Fee validation: `totalFee <= amount`.
- Royalty BPS validation: `<= 10000`.
- Custom errors for gas efficiency.
- CEI pattern (Checks-Effects-Interactions).

### Custom Errors

```solidity
error UnauthorizedCaller(address caller);
error InvalidAmount();
error InsufficientValue(uint256 required, uint256 sent);
error FeeExceedsAmount(uint256 fee, uint256 amount);
error InvalidFeeRecipient();
error InvalidErc20Token();
error InvalidRoyaltyBps(uint256 bps);
error RefundFailed();
error ZeroAddress();
```

---

## Contract Creation Config

```solidity
struct CollectionConfig {
    string name;
    string symbol;
    string description;
    string icon;
    string tokenMetaName;
    string tokenMetaDescription;
    string tokenMetaImage;
}
```

---

## Network Constants

| Item | Base Mainnet | Base Sepolia |
|---|---|---|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

---

## Technology Stack

| Component | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.23, OpenZeppelin 5.x |
| Build & Test | Hardhat (TypeScript) |
| Ethers | v5 |
| Type Generation | TypeChain (ethers-v5) |
| Package Manager | Yarn |
| Deployment | hardhat-deploy |
| CLI | Hardhat Tasks |
| SDK | TypeScript wrappers |
