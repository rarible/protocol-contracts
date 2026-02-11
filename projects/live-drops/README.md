# Live Drops

A system of smart contracts for creating Live Stream Drop NFT collections on Base network.

## Architecture

- **LiveDropFactory** — deploys new ERC-721 collections in a single transaction
- **LiveDropCollection** — ERC-721 NFT collection with paid minting (ETH + USDC), Rarible fee system, ERC-2981 royalties, on-chain metadata, pause/unpause, and burn

## Prerequisites

- Node.js >= 18
- Yarn
- A funded wallet (for deployment and transactions)

## Installation

```bash
cd projects/live-drops
yarn install
```

## Build

```bash
yarn build
# or
npx hardhat compile
```

## Test

```bash
yarn test
# or
npx hardhat test
```

All 83 tests cover: minting (native + ERC-20), fee calculation, burn, royalties, metadata, pause/unpause, access control, and ERC-165.

## Environment Variables

Create a `.env` file:

```env
# Required for deployment
FEE_RECIPIENT=0x...          # Rarible fee recipient address
DEFAULT_ERC20=0x...           # Default ERC-20 token (USDC)
DEFAULT_FEE_BPS=500           # Default 5% fee
DEFAULT_FEE_FIXED_NATIVE=0    # Default fixed native fee (wei)
DEFAULT_FEE_FIXED_ERC20=0     # Default fixed ERC-20 fee

# Network config (via @rarible/deploy-utils)
# Place network JSON files in ~/.ethereum/{network}.json
```

### Network Constants

| Network | USDC Address |
|---|---|
| Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

## Deployment

### Deploy Factory

```bash
# Via hardhat-deploy
npx hardhat deploy --tags LiveDropFactory --network base

# Via CLI task
npx hardhat factory:deploy \
  --fee-recipient 0xYourFeeRecipient \
  --erc20 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  --fee-bps 500 \
  --network base
```

### Create a Collection

```bash
npx hardhat factory:create \
  --factory 0xFactoryAddress \
  --name "My Stream Drop" \
  --symbol "MSD" \
  --description "NFT drop for my live stream" \
  --icon "https://example.com/icon.png" \
  --token-name "Stream Token" \
  --token-description "A token from the live stream" \
  --token-image "https://example.com/token.png" \
  --network base
```

## Minting

### Mint with ETH

```bash
npx hardhat collection:mint-native \
  --address 0xCollectionAddress \
  --amount 0.1 \
  --network base
```

### Mint with USDC

```bash
# First approve USDC spending, then:
npx hardhat collection:mint-erc20 \
  --address 0xCollectionAddress \
  --amount 10 \
  --decimals 6 \
  --network base
```

## CLI Reference

### Factory Commands

| Command | Description |
|---|---|
| `factory:deploy` | Deploy a new factory |
| `factory:defaults:get --factory <addr>` | View factory defaults |
| `factory:defaults:set --factory <addr> --fee-bps <n> ...` | Update defaults |
| `factory:set-fee-recipient --factory <addr> --recipient <addr>` | Update fee recipient |
| `factory:set-erc20 --factory <addr> --token <addr>` | Update default ERC-20 |
| `factory:create --factory <addr> --name ... --symbol ...` | Create collection |
| `factory:list --factory <addr>` | List all collections |

### Collection Commands

| Command | Description |
|---|---|
| `collection:inspect --address <addr>` | View full collection state |
| `collection:mint-native --address <addr> --amount <ETH>` | Mint with ETH |
| `collection:mint-erc20 --address <addr> --amount <units>` | Mint with ERC-20 |
| `collection:set-fees --address <addr> --bps <n>` | Update fees |
| `collection:set-fee-recipient --address <addr> --recipient <addr>` | Update fee recipient (factory owner only) |
| `collection:set-royalty --address <addr> --receiver <addr> --bps <n>` | Update royalties |
| `collection:set-erc20 --address <addr> --token <addr>` | Change ERC-20 token |
| `collection:set-collection-metadata --address <addr> --description ... --icon ...` | Update collection metadata |
| `collection:set-token-metadata --address <addr> --name ... --description ... --image ...` | Update token metadata |
| `collection:pause --address <addr>` | Pause minting |
| `collection:unpause --address <addr>` | Unpause minting |
| `collection:burn --address <addr> --token-id <id>` | Burn a token |

## Fee System

- **Percentage fee**: 0–100% (in basis points: 0–10000). Default: 5% (500 bps)
- **Fixed fee**: Separate values for native and ERC-20 mints. Default: 0
- **Total fee** = `(amount * feeBps / 10000) + fixedFee`
- Fee is deducted FROM the amount the minter pays
- Fee goes to `feeRecipient` (Rarible), remainder goes to collection owner
- `feeRecipient` can only be changed by factory owner (Rarible protection)
- `feeBps` and fixed fees can be changed by collection owner or factory owner

## Royalties (ERC-2981)

- Default: 10% (1000 bps) to collection creator
- Can be changed by collection owner or factory owner
- Respected by ERC-2981 compliant marketplaces

## On-Chain Metadata

- `tokenURI(tokenId)` returns `data:application/json;base64,...` with `{name, description, image}`
- `contractURI()` returns collection-level metadata for marketplaces
- All tokens share the same metadata (can be updated at any time)

## Access Control

| Action | Collection Owner | Factory Owner |
|---|---|---|
| Set fees (bps/fixed) | Yes | Yes |
| Set fee recipient | No | Yes |
| Set royalty | Yes | Yes |
| Set ERC-20 token | Yes | Yes |
| Set metadata | Yes | Yes |
| Pause/Unpause | Yes | Yes |
| Transfer ownership | Yes | — |

## Security Notes

- Contracts use `ReentrancyGuard` on mint functions
- `SafeERC20` for all token transfers
- Native ETH transfers use `.call{value: ...}("")` with revert on failure
- Fee validation: total fee cannot exceed mint amount
- Custom errors for gas efficiency
- Immutable contracts (no proxy/upgrade mechanism)

## Project Structure

```
projects/live-drops/
├── src/                    # Solidity contracts
│   ├── LiveDropFactory.sol
│   ├── LiveDropCollection.sol
│   └── mocks/MockERC20.sol
├── deploy/                 # Deployment scripts
├── sdk/                    # TypeScript wrappers
│   ├── factoryClient.ts
│   ├── collectionClient.ts
│   └── index.ts
├── tasks/                  # CLI (Hardhat tasks)
├── tests/                  # Unit tests
├── utils/                  # Utilities
├── docs/                   # Specification & plan
├── hardhat.config.ts
├── package.json
└── tsconfig.json
```
