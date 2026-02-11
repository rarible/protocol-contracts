# @your-org/live-drops — Shared Package

Shared ABIs, addresses, constants, and types for LiveDrop contracts integration.

## What's Inside

```
src/
  abi/
    factory.ts        # LiveDropFactory ABI (as const — viem type inference)
    collection.ts     # LiveDropCollection ABI (as const)
    erc20.ts          # Minimal ERC-20 ABI (approve, allowance, balanceOf, decimals)
    index.ts
  addresses.ts        # Factory + USDC addresses per chain
  constants.ts        # DEFAULT_FEE_BPS, USDC_DECIMALS, etc.
  types.ts            # Shared TypeScript types (CreateDropParams, payloads, etc.)
  index.ts            # Re-exports everything

examples/
  bff-drizzle-schema.ts  # Drizzle ORM schema (drops + mint_transactions tables)
  bff-routes.ts          # Hono API route examples with Zod validation
  fe-hooks.ts            # Wagmi React hooks (createDrop, mintNative, mintErc20, pause)
```

## Installation in Monorepo

1. Copy `src/` to `packages/live-drops/src/`
2. Add `package.json`:

```json
{
  "name": "@your-org/live-drops",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "viem": "^2.0.0"
  }
}
```

3. Reference from apps:

```json
// apps/anaconda-market-bff/package.json
{ "dependencies": { "@your-org/live-drops": "workspace:*" } }

// apps/rarible-streaming/package.json
{ "dependencies": { "@your-org/live-drops": "workspace:*" } }
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STREAMER (FE)                                              │
│                                                             │
│  1. createCollection(config) ──► sign tx ──► on-chain       │
│  2. Wait for receipt ──► extract CollectionCreated event     │
│  3. POST /api/drops { streamId, collectionAddress, ... }    │
│     ──► BFF saves to DB                                     │
│                                                             │
│  After stream:                                              │
│  4. pause() ──► sign tx (optional)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  VIEWER (FE)                                                │
│                                                             │
│  1. User enters amount, picks currency (ETH / USDC)        │
│  2a. ETH:  mintNative(viewer, amount) { value: amount }     │
│  2b. USDC: approve(collection, amount) then                 │
│            mintErc20(viewer, amount)                         │
│  3. POST /api/drops/:streamId/mints { txHash, amount, ... } │
│     ──► BFF saves pending mint                              │
│  4. Wait for receipt                                        │
│  5. PATCH /api/drops/mints/status { txHash, status }        │
│     ──► BFF updates status to success/failed                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  BFF                                                        │
│                                                             │
│  DB tables:                                                 │
│    drops:             streamId → collectionAddress           │
│    mint_transactions: txHash, status, amount, currency      │
│                                                             │
│  Routes:                                                    │
│    POST   /api/drops                  ← report drop created │
│    GET    /api/drops/:streamId        ← get drop info       │
│    POST   /api/drops/:streamId/mints  ← report mint         │
│    PATCH  /api/drops/mints/status     ← update mint status  │
└─────────────────────────────────────────────────────────────┘
```

## Key On-chain Functions

### Factory (Streamer calls)
| Function | Args | Notes |
|----------|------|-------|
| `createCollection(config)` | `CollectionConfig struct` | Returns `CollectionCreated` event with address |

### Collection (Viewer calls)
| Function | Args | Notes |
|----------|------|-------|
| `mintNative(to, amount)` | `address, uint256` | Send `value >= amount`, excess refunded |
| `mintErc20(to, amount)` | `address, uint256` | Requires prior `approve` on USDC |

### Collection (Streamer calls)
| Function | Args | Notes |
|----------|------|-------|
| `pause()` | — | Blocks minting |
| `unpause()` | — | Resumes minting |

### USDC (Viewer calls before mintErc20)
| Function | Args | Notes |
|----------|------|-------|
| `approve(spender, amount)` | `address, uint256` | Spender = collection address |

## Fee Distribution

On every mint, the payment `amount` is split:
- **5% fee** → Rarible fee recipient (configured in factory)
- **95% remainder** → Collection creator (streamer)

Viewer always pays exactly what they enter. Fee is deducted from that amount.
