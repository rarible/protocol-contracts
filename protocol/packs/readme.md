# RARI Packs

A gamified NFT pack system that allows users to purchase mystery packs containing randomly selected NFTs from curated pools, powered by Chainlink VRF for verifiable randomness.

## Overview

RARI Packs creates an engaging unboxing experience where users:
1. **Purchase** packs of varying tiers (Bronze → Platinum)
2. **Open** packs to reveal randomly selected NFTs
3. **Claim** either the revealed NFTs or instant ETH based on floor prices

The system uses a probability-weighted selection across five rarity pools, with higher-tier packs offering better odds at rare NFTs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Wallet                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   RariPack    │   │  PackManager  │   │    NftPool    │
│   (ERC-721)   │◄──┤  (VRF + Logic)│──►│  (NFT Storage)│
│               │   │               │   │               │
│ • Mint packs  │   │ • Open packs  │   │ • Store NFTs  │
│ • Pack types  │   │ • VRF random  │   │ • Pool levels │
│ • Metadata    │   │ • Claim NFTs  │   │ • Selection   │
│ • Pricing     │   │ • Instant ETH │   │ • Lock/Unlock │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Chainlink VRF │
                    │ (Randomness)  │
                    └───────────────┘
```

### Contracts

| Contract | Purpose |
|----------|---------|
| **RariPack** | ERC-721 pack NFTs with dynamic on-chain metadata, pack types, pricing |
| **PackManager** | Orchestrates pack opening via Chainlink VRF, manages claims |
| **NftPool** | Holds NFTs organized by price-based pool levels |

## Pack Types

| Type | Tier | UltraRare Chance | Description |
|------|------|------------------|-------------|
| **Bronze** | Entry | 0% | Best for newcomers |
| **Silver** | Standard | 0% | Improved odds |
| **Gold** | Premium | 0% | Better rare chances |
| **Platinum** | Elite | 0.1% | Only tier with UltraRare access |

## Pool Levels

NFTs are automatically categorized into pools based on their collection's floor price:

| Level | Floor Price Range | Drop Rate (approx) |
|-------|-------------------|-------------------|
| **Common** | 0 - 0.5 ETH | ~91% |
| **Rare** | 0.5 - 2 ETH | ~7% |
| **Epic** | 2 - 10 ETH | ~1.5% |
| **Legendary** | 10 - 50 ETH | ~0.4% |
| **UltraRare** | 50+ ETH | ~0.1% (Platinum only) |

## Pack Lifecycle

### State Diagram

```
                    ┌──────────────────┐
                    │                  │
            mint    │    MINTED        │
       ────────────►│   (Unopened)     │
                    │                  │
                    └────────┬─────────┘
                             │
                             │ openPack()
                             ▼
                    ┌──────────────────┐
                    │                  │
                    │ VRF_PENDING      │◄────┐
                    │ (Awaiting VRF)   │     │ retry if failed
                    │                  │     │
                    └────────┬─────────┘─────┘
                             │
                             │ VRF callback
                             ▼
                    ┌──────────────────┐
                    │                  │
                    │    OPENED        │
                    │ (Contents Locked)│
                    │                  │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐            ┌────────────────┐
     │   claimNft()   │            │ claimReward()  │
     │                │            │                │
     │ Transfer NFTs  │            │ Instant ETH    │
     │ to User        │            │ (80% floor)    │
     │                │            │                │
     │ NFTs leave     │            │ NFTs stay in   │
     │ the pool       │            │ pool (re-added)│
     └───────┬────────┘            └───────┬────────┘
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │                  │
                    │     BURNED       │
                    │  (Pack deleted)  │
                    │                  │
                    └──────────────────┘
```

### Sequence Flow

```
┌──────┐          ┌──────────┐          ┌───────────┐          ┌─────────┐          ┌─────────────┐
│ User │          │ RariPack │          │PackManager│          │ NftPool │          │Chainlink VRF│
└──┬───┘          └────┬─────┘          └─────┬─────┘          └────┬────┘          └──────┬──────┘
   │                   │                      │                     │                      │
   │  1. mintPack()    │                      │                     │                      │
   │──────────────────►│                      │                     │                      │
   │   (pay ETH)       │                      │                     │                      │
   │                   │                      │                     │                      │
   │  Pack NFT minted  │                      │                     │                      │
   │◄──────────────────│                      │                     │                      │
   │                   │                      │                     │                      │
   │                   │                      │                     │                      │
   │  2. openPack(tokenId)                    │                     │                      │
   │─────────────────────────────────────────►│                     │                      │
   │                   │                      │                     │                      │
   │                   │                      │  3. requestRandomWords()                   │
   │                   │                      │────────────────────────────────────────────►
   │                   │                      │                     │                      │
   │  requestId        │                      │                     │    requestId         │
   │◄─────────────────────────────────────────│◄────────────────────────────────────────────
   │                   │                      │                     │                      │
   │                   │                      │                     │                      │
   │                   │   4. rawFulfillRandomWords(requestId, randomWords[])              │
   │                   │                      │◄────────────────────────────────────────────
   │                   │                      │                     │                      │
   │                   │                      │ 5. selectAndLock    │                      │
   │                   │                      │    FromLevel() x3   │                      │
   │                   │                      │────────────────────►│                      │
   │                   │                      │   (collection,      │                      │
   │                   │                      │    tokenId)         │                      │
   │                   │                      │◄────────────────────│                      │
   │                   │                      │                     │                      │
   │                   │  6. setPackContents  │                     │                      │
   │                   │◄─────────────────────│                     │                      │
   │                   │   (lock NFT refs)    │                     │                      │
   │                   │                      │                     │                      │
   │  PackOpened event │                      │                     │                      │
   │◄─────────────────────────────────────────│                     │                      │
   │                   │                      │                     │                      │
   │                   │                      │                     │                      │
   ├───────────────────┼──────────────────────┼─────────────────────┼──────────────────────┤
   │                   │    CLAIM PATH A: NFTs                      │                      │
   ├───────────────────┼──────────────────────┼─────────────────────┼──────────────────────┤
   │                   │                      │                     │                      │
   │  7a. claimNft(tokenId)                   │                     │                      │
   │─────────────────────────────────────────►│                     │                      │
   │                   │                      │                     │                      │
   │                   │                      │ 8a. transferLocked  │                      │
   │                   │                      │     Nft() x3        │                      │
   │                   │                      │────────────────────►│                      │
   │                   │                      │                     │  Transfer NFTs       │
   │◄──────────────────┼──────────────────────┼─────────────────────│  to user             │
   │                   │                      │                     │                      │
   │                   │  9a. burnPack()      │                     │                      │
   │                   │◄─────────────────────│                     │                      │
   │                   │                      │                     │                      │
   │                   │                      │                     │                      │
   ├───────────────────┼──────────────────────┼─────────────────────┼──────────────────────┤
   │                   │   CLAIM PATH B: ETH (Instant Cash)         │                      │
   ├───────────────────┼──────────────────────┼─────────────────────┼──────────────────────┤
   │                   │                      │                     │                      │
   │  7b. claimReward(tokenId)                │                     │                      │
   │─────────────────────────────────────────►│                     │                      │
   │                   │                      │                     │                      │
   │                   │                      │ 8b. addLockedNft()  │                      │
   │                   │                      │     x3              │                      │
   │                   │                      │────────────────────►│                      │
   │                   │                      │  (re-add to pool    │                      │
   │                   │                      │   accounting)       │                      │
   │                   │                      │                     │                      │
   │                   │  9b. burnPack()      │                     │                      │
   │                   │◄─────────────────────│                     │                      │
   │                   │                      │                     │                      │
   │  ETH payout       │                      │                     │                      │
   │◄─────────────────────────────────────────│                     │                      │
   │  (80% of floor    │                      │                     │                      │
   │   prices)         │                      │                     │                      │
   │                   │                      │                     │                      │
└──┴───────────────────┴──────────────────────┴─────────────────────┴──────────────────────┘
```

## NFT Locking Mechanism

During pack opening, NFTs are **locked** rather than transferred:

1. **Lock**: `selectAndLockFromLevel()` removes NFT from pool accounting but keeps ownership with NftPool
2. **Claim NFT**: `transferLockedNft()` transfers the locked NFT to the user
3. **Claim ETH**: `addLockedNft()` re-adds the NFT back to pool accounting (NFT never left the pool)

This design ensures:
- NFTs can be efficiently re-used when users opt for instant cash
- No unnecessary transfers during the reveal phase
- Gas-efficient batch operations

## Probability System

Selection uses a two-stage random process:

1. **Pool Level Selection**: Based on pack type probabilities
2. **NFT Selection**: Equal probability within the selected pool level

### Default Probabilities

Higher tier packs have progressively better odds for rare items:

| Pack Type | UltraRare | Legendary | Epic | Rare | Common |
|-----------|-----------|-----------|------|------|--------|
| **Platinum** | 0.5% | 2% | 7% | 20% | 70.5% |
| **Gold** | — | 1% | 5% | 15% | 79% |
| **Silver** | — | 0.5% | 3% | 10% | 86.5% |
| **Bronze** | — | 0.2% | 1% | 5% | 93.8% |

> **Note**: Only Platinum packs have access to UltraRare pool items.

## Instant Cash Feature

When enabled, users can opt to receive ETH instead of NFTs:

- **Payout**: 80% of combined floor prices of revealed NFTs
- **NFTs**: Remain in pool and become available for future packs
- **Benefit**: Liquidity without selling NFTs on secondary markets

## Key Features

### Dynamic On-Chain Metadata
RariPack generates fully on-chain JSON metadata including:
- Pack type and state (Opened/Unopened)
- Locked NFT contents (collections and token IDs)
- Custom images per pack type

### Verifiable Randomness
Uses Chainlink VRF v2.5 ensuring:
- Provably fair NFT selection
- Tamper-proof random number generation
- On-chain verification

### Pausable Operations
Contract owner can pause/unpause:
- Pack opening
- NFT claiming
- Instant cash claims

## Roles & Access Control

| Role | Contract | Permissions |
|------|----------|-------------|
| `DEFAULT_ADMIN_ROLE` | RariPack | Set prices, URIs, treasury |
| `BURNER_ROLE` | RariPack | Burn packs, set contents |
| `POOL_MANAGER_ROLE` | NftPool | Transfer NFTs, configure collections |
| `Owner` | PackManager | Configure VRF, enable instant cash, pause |
| `Owner` | NftPool | Set pool ranges |

## Deployment Checklist

1. Deploy `RariPack` with treasury address
2. Deploy `NftPool` with owner
3. Deploy `PackManager` with RariPack address
4. Grant `BURNER_ROLE` on RariPack to PackManager
5. Grant `POOL_MANAGER_ROLE` on NftPool to PackManager
6. Configure VRF on PackManager
7. Set NftPool address on PackManager
8. Configure pack prices on RariPack
9. Configure collections on NftPool
10. Deposit NFTs to NftPool
11. (Optional) Enable instant cash and fund treasury

## Events

### RariPack
- `PackPriceUpdated` - Pack price changed
- `PackURIUpdated` - Pack image URI changed
- `PackContentsUpdated` - NFT contents locked in pack

### PackManager
- `PackOpenRequested` - User initiated pack opening
- `PackOpened` - VRF fulfilled, NFTs locked
- `NftClaimed` - User claimed NFTs
- `InstantCashClaimed` - User claimed ETH reward

### NftPool
- `Deposited` - NFT added to pool
- `Withdrawn` - NFT removed from pool
- `CollectionConfigured` - Collection settings updated

