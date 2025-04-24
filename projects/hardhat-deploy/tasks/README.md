
# `sanity-check` – Hardhat Task Documentation

## 📋 Description

The `sanity-check` task performs a full end-to-end minting and trading simulation for Rarible-style NFTs (ERC721 and ERC1155). It is designed to **run immediately after deploying your contracts** using the `hardhat-deploy` plugin.

This task:
- Connects to deployed ERC721 and ERC1155 factory contracts.
- Mints tokens deterministically via factory contracts.
- Creates a new random buyer wallet and funds it with ETH.
- Lists and buys NFTs using both ETH and a newly deployed ERC20 token.
- Returns any leftover ETH from the buyer back to the seller wallet.

---

## 🧠 Prerequisite

Before running this task, deploy your contracts using:

```bash
npx hardhat deploy --tags all --network <networkName>
```

Then use the deployed addresses as parameters to this task.

---

## 🛠️ Task Parameters

| Name             | Type   | Required | Description                                                                 |
|------------------|--------|----------|-----------------------------------------------------------------------------|
| `--factory721`   | string | ✅ yes   | Address of the deployed ERC721 factory contract                             |
| `--factory1155`  | string | ✅ yes   | Address of the deployed ERC1155 factory contract                            |
| `--transfer-amount` | string | ✅ yes   | Amount of ETH to transfer to the buyer wallet                               |
| `--exchange`     | string | ✅ yes   | Address of the deployed exchange contract (ExchangeV2 or ExchangeMetaV2)    |
| `--price`        | string | ❌ no    | Price for the NFT in wei. Default is `"1000"`                               |
| `--salt`         | string | ❌ no    | Salt for deterministic NFT address generation. Default is `"0"`            |

---

## 🚀 Example Usage

### Basic Run (after deployment)

```bash
npx hardhat sanity-check \
  --network sepolia \
  --factory721 0x1234...abcd \
  --factory1155 0xabcd...1234 \
  --transfer-amount 0.05 \
  --exchange 0x5678...ef01
```

### With Optional Price and Salt

```bash
npx hardhat sanity-check \
  --network sepolia \
  --factory721 0x1234...abcd \
  --factory1155 0xabcd...1234 \
  --transfer-amount 0.05 \
  --exchange 0x5678...ef01 \
  --price 5000 \
  --salt 42
```

---

## ⚙️ How It Works (Step-by-Step)

1. **Connect to NFT Factories:** The script attaches to both the ERC721 and ERC1155 factory contracts using the provided addresses.
2. **Compute Token Addresses:** Uses deterministic salt-based logic to derive the token contract addresses.
3. **Mint & Approve:** Mints NFTs and approves the exchange to manage them.
4. **Create Buyer Wallet:** Generates a new wallet and transfers the specified ETH to it.
5. **Buy NFT with ETH:** Uses the buyer wallet to purchase one NFT using ETH.
6. **Deploy Test ERC20 Token:** Deploys a `TestERC20` contract with a proxy and mints tokens to the buyer.
7. **Buy NFT with ERC20:** Uses the buyer wallet to purchase a second NFT using the test ERC20 token.
8. **Return ETH to Seller:** Sends any remaining ETH from the buyer wallet back to the seller wallet, retrying with increasing gas price multipliers if necessary.

---

## ✅ Requirements

- Hardhat project must use **TypeScript**.
- Contracts must be deployed using `hardhat-deploy`.
- Typechain-generated typings must exist in `typechain-types/`.
- Your deployment config (`getConfig`) must return valid settings for `deploy_meta` and `deploy_non_meta`.

---

## 📂 File Structure Overview

This task lives inside your Hardhat project and may use the following file structure:

```
tasks/
├── sanityCheck.ts   <-- Your main task
├── sanityCheckUtils/
│   └── utils.ts     <-- Reusable logic (listing, buying, etc.)
utils/
├── utils.ts         <-- getConfig and other helpers
typechain-types/     <-- Auto-generated typings from TypeChain
```

---
