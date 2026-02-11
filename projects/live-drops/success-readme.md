# Live Drops — Getting Started Guide

This guide explains how to use the Live Drops system in simple terms. No deep technical knowledge required.

## What Is This?

Live Drops is a system for creating NFT collections for live streams. Think of it as:

- **Factory** — a "machine" that creates new NFT collections. There is one factory, and it can create unlimited collections.
- **Collection** — a set of NFTs (digital tokens) linked to a specific live stream. Each stream gets its own collection.
- **Minting** — creating a new NFT in a collection. Users pay to mint, and the money goes to the stream creator.

## Glossary

| Term | Meaning |
|---|---|
| **Factory** | The main contract that creates new collections |
| **Collection** | An NFT collection (ERC-721) for a specific stream |
| **Mint** | Creating a new NFT token (costs money) |
| **Fee** | A small percentage (5% by default) that goes to Rarible |
| **Royalty** | A percentage (10% by default) paid to the creator on secondary sales |
| **USDC** | A stablecoin pegged to USD, used as an alternative to ETH for payments |
| **Pause** | Temporarily disabling minting on a collection |
| **Burn** | Permanently destroying an NFT token |

## How Money Flows

When someone mints an NFT:

```
User pays $10 (in ETH or USDC)
  ├── $0.50 (5%) → Rarible (fee)
  └── $9.50 (95%) → Stream Creator
```

On secondary sales (when the NFT is resold):
```
Buyer pays $100
  └── $10 (10%) → Original Creator (royalty)
```

## Step-by-Step Guide

### Prerequisites

You need:
- A computer with Node.js installed (ask your engineer)
- A wallet with ETH on Base network (for gas fees)

### Step 1: Install the Project

Ask your engineer to run:
```bash
cd projects/live-drops
yarn install
yarn build
```

### Step 2: Deploy the Factory (One-Time Setup)

This only needs to be done once. The factory creates all future collections.

```bash
npx hardhat factory:deploy \
  --fee-recipient 0xYourRaribleWallet \
  --erc20 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  --network base
```

You'll see:
```
✅ LiveDropFactory deployed at: 0x1234...abcd
```

**Save this address!** You'll need it for all future operations.

### Step 3: Create a Collection for a Live Stream

Each stream gets its own collection:

```bash
npx hardhat factory:create \
  --factory 0xYourFactoryAddress \
  --name "Friday Night Stream #42" \
  --symbol "FNS42" \
  --description "NFT drop for Friday Night Stream episode 42" \
  --icon "https://your-cdn.com/stream42-icon.png" \
  --token-name "FNS42 Token" \
  --token-description "Collectible from Friday Night Stream #42" \
  --token-image "https://your-cdn.com/stream42-nft.png" \
  --network base
```

You'll see:
```
Creating collection "Friday Night Stream #42"... tx: 0xabc...
✅ Collection created at: 0x5678...efgh

=== Collection Created ===
  Address:  0x5678...efgh
  Creator:  0xYourWallet
  Name:     Friday Night Stream #42
  Symbol:   FNS42
```

**Save the collection address!**

### Step 4: Mint an NFT with ETH

A viewer can mint an NFT by paying ETH:

```bash
npx hardhat collection:mint-native \
  --address 0xCollectionAddress \
  --amount 0.01 \
  --network base
```

You'll see:
```
Minting with native ETH... tx: 0xdef...
✅ Minted token #0 to 0xMinterWallet (fee: 500000000000000)

=== Mint Result ===
  Token ID: 0
  To:       0xMinterWallet
  Amount:   0.01 ETH
  Fee:      0.0005 ETH
```

### Step 5: Mint an NFT with USDC

For USDC payments (note: minter must first approve USDC spending):

```bash
npx hardhat collection:mint-erc20 \
  --address 0xCollectionAddress \
  --amount 5 \
  --decimals 6 \
  --network base
```

You'll see:
```
Amount in smallest units: 5000000 (5 with 6 decimals)
Minting with ERC-20... tx: 0x123...
✅ Minted token #1 to 0xMinterWallet (fee: 250000)

=== Mint Result ===
  Token ID: 1
  To:       0xMinterWallet
  Amount:   5.0 tokens
  Fee:      0.25 tokens
```

### Step 6: View Collection State

Check the current state of any collection:

```bash
npx hardhat collection:inspect \
  --address 0xCollectionAddress \
  --network base
```

### Step 7: Pause a Collection

When the stream ends, you can pause minting:

```bash
npx hardhat collection:pause \
  --address 0xCollectionAddress \
  --network base
```

To re-enable:
```bash
npx hardhat collection:unpause \
  --address 0xCollectionAddress \
  --network base
```

## What You Can Change

| What | Command | Who Can Do It |
|---|---|---|
| Fee percentage | `collection:set-fees` | Stream creator or Rarible |
| Fee recipient | `collection:set-fee-recipient` | Rarible only |
| Royalty | `collection:set-royalty` | Stream creator or Rarible |
| Payment token | `collection:set-erc20` | Stream creator or Rarible |
| Collection info | `collection:set-collection-metadata` | Stream creator or Rarible |
| Token artwork | `collection:set-token-metadata` | Stream creator or Rarible |
| Pause/Unpause | `collection:pause` / `collection:unpause` | Stream creator or Rarible |

## Troubleshooting

### "Insufficient funds"
Your wallet doesn't have enough ETH for gas or the mint amount. Add ETH to your wallet on Base network.

### "InsufficientValue"
You're trying to mint but sent less ETH than the required amount. Check the `--amount` parameter.

### "InvalidAmount"
The mint amount must be greater than 0. You can't mint for free.

### "EnforcedPause"
The collection is currently paused. The creator or Rarible admin needs to unpause it.

### "ERC20: insufficient allowance"
For USDC mints, you need to approve the collection contract to spend your USDC first. Ask your engineer to help with the approval transaction.

### "UnauthorizedCaller"
You're trying to perform an admin action but you're not the collection owner or factory owner.

### "OnlyFactoryOwner"
You're trying to change the fee recipient, but only the factory owner (Rarible) can do this.

### "FeeExceedsAmount"
The fee configuration is set so that the total fee would exceed the payment amount. Reduce the fixed fee or mint with a larger amount.

## Factory Defaults

These are automatically applied to all new collections:

| Setting | Default Value |
|---|---|
| Fee | 5% |
| Fixed Fee (ETH) | 0 |
| Fixed Fee (USDC) | 0 |
| Royalty | 10% |
| Payment Token | USDC on Base |
