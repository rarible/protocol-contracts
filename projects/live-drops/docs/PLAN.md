# Live Drops — Implementation Plan

> **Last updated:** 2026-02-11

## Project Structure

```
projects/live-drops/
├── src/
│   ├── LiveDropFactory.sol
│   ├── LiveDropCollection.sol
│   └── mocks/
│       └── MockERC20.sol
├── deploy/
│   └── 001_deploy_LiveDropFactory.ts
├── sdk/
│   ├── index.ts
│   ├── factoryClient.ts
│   └── collectionClient.ts
├── tasks/
│   ├── index.ts
│   ├── factory-deploy.ts
│   ├── factory-defaults-get.ts
│   ├── factory-defaults-set.ts
│   ├── factory-create.ts
│   ├── factory-set-fee-recipient.ts
│   ├── factory-set-erc20.ts
│   ├── factory-list.ts
│   ├── collection-inspect.ts
│   ├── collection-mint-native.ts
│   ├── collection-mint-erc20.ts
│   ├── collection-set-fees.ts
│   ├── collection-set-fee-recipient.ts
│   ├── collection-set-royalty.ts
│   ├── collection-set-erc20.ts
│   ├── collection-set-collection-metadata.ts
│   ├── collection-set-token-metadata.ts
│   ├── collection-pause.ts
│   ├── collection-unpause.ts
│   └── collection-burn.ts
├── tests/
│   ├── Factory.test.ts
│   └── Collection.test.ts
├── utils/
│   └── index.ts
├── docs/
│   ├── SPECIFICATION.md
│   └── PLAN.md
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
└── success-readme.md
```

---

## Tasks

### Phase 1: Project Scaffolding
- [x] **1.1** Create `package.json` with all dependencies
- [x] **1.2** Create `tsconfig.json`
- [x] **1.3** Create `hardhat.config.ts`
- [x] **1.4** Create `.gitignore`
- [x] **1.5** Create `utils/index.ts`
- [x] **1.6** Install dependencies

### Phase 2: Smart Contracts
- [x] **2.1** Create `src/mocks/MockERC20.sol` — test ERC-20 with configurable decimals
- [x] **2.2** Create `src/LiveDropCollection.sol` — full ERC-721 collection contract
- [x] **2.3** Create `src/LiveDropFactory.sol` — factory contract

### Phase 3: Compilation & Verification
- [x] **3.1** Compile contracts — fixed "Stack too deep" with `viaIR: true`
- [x] **3.2** All 30 Solidity files compile, 86 TypeChain typings generated

### Phase 4: Unit Tests
- [x] **4.1** Create `tests/Factory.test.ts` (28 tests)
- [x] **4.2** Create `tests/Collection.test.ts` (55 tests)
- [x] **4.3** All 83 tests passing

### Phase 5: Deployment Scripts
- [x] **5.1** Create `deploy/001_deploy_LiveDropFactory.ts`

### Phase 6: SDK (TypeScript Wrappers)
- [x] **6.1** Create `sdk/factoryClient.ts`
- [x] **6.2** Create `sdk/collectionClient.ts`
- [x] **6.3** Create `sdk/index.ts` — re-exports

### Phase 7: CLI (Hardhat Tasks)
- [x] **7.1** Factory tasks (7 tasks)
- [x] **7.2** Collection tasks (12 tasks)
- [x] **7.3** Create `tasks/index.ts` — import all tasks

### Phase 8: Documentation
- [x] **8.1** Create `README.md` (technical)
- [x] **8.2** Create `success-readme.md` (non-technical guide)

### Phase 9: Final Verification
- [x] **9.1** Clean compile passes (30 Solidity files)
- [x] **9.2** All 83 tests pass
- [x] **9.3** All files reviewed for completeness
- [x] **9.4** CLI tasks load correctly

---

## Design Decisions

### 1. Dynamic Factory Owner Lookup
Instead of storing `factoryOwner` as immutable, we store `factory` address as immutable and call `Ownable(factory).owner()` dynamically. This ensures collection automatically recognizes new factory owner after ownership transfer.

### 2. Fee Recipient Protection
`feeRecipient` on collections can only be changed by factory owner (not collection owner). This prevents collection owners from redirecting Rarible's commission to themselves.

### 3. Mint with Recipient
`mintNative(address to, uint256 amount)` and `mintErc20(address to, uint256 amount)` accept a `to` parameter for the NFT recipient. This allows minting for someone else (gifting, tipping).

### 4. contractURI()
Added `contractURI()` that returns base64 JSON with collection metadata. This provides marketplace compatibility (OpenSea, etc.) at no additional cost.

### 5. OpenZeppelin 5.x
Using OpenZeppelin 5.x for latest security patches and modern patterns. Key differences from v4:
- `Ownable` requires initial owner in constructor
- Custom errors instead of string reverts
- `ERC721` constructor takes name and symbol
- `_safeMint` replaces `_mint` for safety

### 6. viaIR Compilation
Constructor with 16 parameters caused "Stack too deep" error. Resolved by enabling `viaIR: true` in Hardhat config (same approach as the drops project).

### 7. Royalty Set in Constructor
Royalties are set in the LiveDropCollection constructor (not via external call from factory), because the factory contract address is neither the collection owner nor the factory owner, so it cannot call `onlyOwnerOrFactoryOwner` restricted functions.

### 8. No Freeze Metadata
Metadata freeze functionality was explicitly excluded from requirements.
