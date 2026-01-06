# Cryptoys Contracts

Test implementation of the Digitoys contract from Abstract chain, featuring ERC721 tokens with lock/unlock functionality and an item equipping system with EIP712 signatures.

## Contracts

| Contract | Description |
|----------|-------------|
| `Digitoys.sol` | Main ERC721 contract with lock/unlock and equip/unequip functionality |
| `DigitoysBaseERC721.sol` | Base ERC721 with lock/unlock mechanics |
| `DigitoysItems.sol` | ERC721 for equippable items |

## Quick Start

```bash
cd projects/cryptoys
yarn install
yarn build:abi   # Compile and generate ABI files
yarn test        # Run tests
```

## Commands

| Command | Description |
|---------|-------------|
| `yarn build` | Compile contracts |
| `yarn build:abi` | Compile + extract clean ABI JSON files to `abi/` |
| `yarn test` | Run tests |
| `yarn clean` | Remove build artifacts |

## Build ABI

```bash
# Compile and extract ABI files
yarn build:abi
```

The ABI files will be generated in:
- `artifacts/contracts/` - Full Hardhat artifacts
- `abi/` - Full contract artifacts (ABI + bytecode):
  - `abi/Digitoys.json`
  - `abi/DigitoysItems.json`
  - `abi/DigitoysBaseERC721.json`

### Manual ABI Extraction

```bash
# Compile only
yarn build

# Extract with jq
cat artifacts/contracts/Digitoys.sol/Digitoys.json | jq '.abi' > Digitoys.json
```

## Run Tests

```bash
yarn test
```

Tests run on Hardhat's built-in network (no external blockchain required).

## Key Features

### Lock/Unlock

Tokens can be locked to prevent transfers:

```solidity
// Lock a token (only owner, locker, or token owner)
digitoys.lock(tokenId);

// Check if locked
bool locked = digitoys.isLocked(tokenId);

// Unlock a token
digitoys.unlock(tokenId);
```

**Authorization:**
- Contract owner can lock/unlock any token
- Designated locker address can lock/unlock any token
- Token owner can lock/unlock their own token

### Equip/Unequip Items

Items can be equipped to Digitoys tokens using EIP712 signatures:

```solidity
// Equip an item (requires signature from signer)
digitoys.equip(itemId, tokenId, deadline, signature);

// Unequip an item
digitoys.unequip(tokenId, itemId);

// Get equipped items
uint256[] memory items = digitoys.equippedItems(tokenId);

// Check if item is equipped
bool equipped = digitoys.isEquipped(tokenId, itemId);
```

### EIP712 Signature

The equip operation requires a signature with the following typed data:

```javascript
const domain = {
  name: "Digitoys",
  version: "1",
  chainId: chainId,
  verifyingContract: digitoysAddress
};

const types = {
  Equip: [
    { name: "itemId", type: "uint256" },
    { name: "equippingTokenId", type: "uint256" },
    { name: "owner", type: "address" },
    { name: "deadline", type: "uint256" }
  ]
};

const value = {
  itemId: itemId,
  equippingTokenId: tokenId,
  owner: tokenOwnerAddress,
  deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

const signature = await signer._signTypedData(domain, types, value);
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Digitoys                           │
│  - mintToy(to, isLocked)                               │
│  - equip(itemId, tokenId, deadline, sig)               │
│  - unequip(tokenId, itemId)                            │
│  - equippedItems(tokenId)                              │
└───────────────────────┬─────────────────────────────────┘
                        │ extends
┌───────────────────────▼─────────────────────────────────┐
│               DigitoysBaseERC721                        │
│  - lock(tokenId)                                        │
│  - unlock(tokenId)                                      │
│  - isLocked(tokenId)                                    │
│  - _afterLock(tokenId)  [hook]                         │
│  - _afterUnlock(tokenId) [hook]                        │
└───────────────────────┬─────────────────────────────────┘
                        │ extends
┌───────────────────────▼─────────────────────────────────┐
│           ERC721EnumerableUpgradeable                   │
│                  (OpenZeppelin)                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   DigitoysItems                         │
│  - mint(to, itemType)                                   │
│  - mintWithId(to, tokenId, itemType)                   │
│  - itemType(tokenId)                                    │
│  - burnItem(tokenId)                                    │
└─────────────────────────────────────────────────────────┘
```

## License

MIT
