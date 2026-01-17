import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { network } from "hardhat";

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Network configuration with mint amounts
const NETWORK_CONFIG: Record<string, { 
  chainId: string;
  mintAmounts: { common: number; rare: number; epic: number; legendary: number; ultraRare: number };
}> = {
  base: { 
    chainId: "8453",
    // Smaller amounts for mainnet (real costs)
    mintAmounts: { common: 10, rare: 8, epic: 5, legendary: 3, ultraRare: 2 },
  },
  sepolia: { 
    chainId: "11155111",
    // Larger amounts for testnet
    mintAmounts: { common: 50, rare: 30, epic: 15, legendary: 8, ultraRare: 5 },
  },
};

// Floor prices for each collection (TEST MODE at ETH=$3300)
// 1 cent = $0.01 / $3300 = 0.000003 ETH = 3000000000000 wei
const FLOOR_PRICES: Record<string, bigint> = {
  common: BigInt("3000000000000"), // 0.000003 ETH (1 cent)
  rare: BigInt("6000000000000"), // 0.000006 ETH (2 cents)
  epic: BigInt("9000000000000"), // 0.000009 ETH (3 cents)
  legendary: BigInt("12000000000000"), // 0.000012 ETH (4 cents)
  ultraRare: BigInt("15000000000000"), // 0.000015 ETH (5 cents)
};

/**
 * Step 3: Configure collections, mint items, and deposit them into NftPool.
 * Each rarity level has a different mint amount (network-specific defaults).
 *
 * Base (mainnet) defaults: common=10, rare=8, epic=5, legendary=3, ultraRare=2
 * Sepolia (testnet) defaults: common=50, rare=30, epic=15, legendary=8, ultraRare=5
 *
 * Environment variables (optional overrides):
 * - MINT_COMMON, MINT_RARE, MINT_EPIC, MINT_LEGENDARY, MINT_ULTRA_RARE
 *
 * Usage:
 *   yarn step3:base
 *   yarn step3:sepolia
 */
async function main() {
  const { ethers, networkName } = await network.connect() as any;

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();

  // Get mint amounts from env or use network defaults
  const defaults = config.mintAmounts;
  const mintAmounts = {
    common: parseInt(process.env.MINT_COMMON ?? String(defaults.common)),
    rare: parseInt(process.env.MINT_RARE ?? String(defaults.rare)),
    epic: parseInt(process.env.MINT_EPIC ?? String(defaults.epic)),
    legendary: parseInt(process.env.MINT_LEGENDARY ?? String(defaults.legendary)),
    ultraRare: parseInt(process.env.MINT_ULTRA_RARE ?? String(defaults.ultraRare)),
  };

  // Paths
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const deploymentsDir = path.join(projectRoot, "ignition", "deployments", `chain-${config.chainId}`);

  // Load deployed addresses
  const collectionsPath = path.join(deploymentsDir, "item_collections.json");
  const infraPath = path.join(deploymentsDir, "infrastructure.json");

  if (!fs.existsSync(collectionsPath)) {
    throw new Error(`Collections not found. Run 'yarn step1:${networkName}' first.`);
  }
  if (!fs.existsSync(infraPath)) {
    throw new Error(`Infrastructure not found. Run 'yarn step2:${networkName}' first.`);
  }

  const collections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
  const infrastructure = JSON.parse(fs.readFileSync(infraPath, "utf-8"));

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║         STEP 3: Mint & Deposit Items (${networkName.toUpperCase().padEnd(7)})            ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:    ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:     ${signer.address}`);
  console.log(`NftPool:    ${infrastructure.nftPool}\n`);

  console.log("Mint amounts per rarity:");
  console.log(`  Common:     ${mintAmounts.common}`);
  console.log(`  Rare:       ${mintAmounts.rare}`);
  console.log(`  Epic:       ${mintAmounts.epic}`);
  console.log(`  Legendary:  ${mintAmounts.legendary}`);
  console.log(`  Ultra-Rare: ${mintAmounts.ultraRare}`);
  console.log("");

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`Starting nonce: ${nonce}\n`);

  // ItemCollection ABI (minimal) - Note: ERC721A with _startTokenId = 1
  const ItemCollectionABI = [
    "function mintBatch(address to, uint256 quantity) external",
    "function setApprovalForAll(address operator, bool approved) external",
    "function totalMinted() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
  ];
  
  // ERC721A _startTokenId for ItemCollection
  const START_TOKEN_ID = 1;

  // NftPool ABI (minimal)
  const NftPoolABI = [
    "function configureCollection(address collection, bool allowed, uint256 floorPrice) external",
    "function deposit(address collection, uint256 tokenId) external",
    "function depositBatch(address[] calldata collections, uint256[] calldata tokenIds) external",
    "function isNftInPool(address collection, uint256 tokenId) external view returns (bool)",
    "function getCollectionInfo(address collection) external view returns (bool allowed, uint256 floorPrice, uint8 poolLevel)",
  ];

  const nftPool = new ethers.Contract(infrastructure.nftPool, NftPoolABI, signer);

  const collectionEntries = [
    { name: "Common", key: "common", address: collections.common, amount: mintAmounts.common, floorPrice: FLOOR_PRICES.common },
    { name: "Rare", key: "rare", address: collections.rare, amount: mintAmounts.rare, floorPrice: FLOOR_PRICES.rare },
    { name: "Epic", key: "epic", address: collections.epic, amount: mintAmounts.epic, floorPrice: FLOOR_PRICES.epic },
    { name: "Legendary", key: "legendary", address: collections.legendary, amount: mintAmounts.legendary, floorPrice: FLOOR_PRICES.legendary },
    { name: "Ultra-Rare", key: "ultraRare", address: collections.ultraRare, amount: mintAmounts.ultraRare, floorPrice: FLOOR_PRICES.ultraRare },
  ];

  // ============================================
  // Phase 1: Configure all collections on NftPool
  // ============================================
  console.log("--- Phase 1: Configure Collections on NftPool ---\n");
  console.log("Setting floor prices (TEST MODE at ETH=$3300):\n");

  let configuredCount = 0;
  let skippedConfigCount = 0;
  
  for (const { name, address, floorPrice } of collectionEntries) {
    const floorEth = Number(floorPrice) / 1e18;
    const usdCents = Math.round(floorEth * 3300 * 100);
    
    // Check if already configured with a price
    const [isAllowed, existingFloorPrice] = await nftPool.getCollectionInfo(address);
    if (isAllowed && existingFloorPrice > 0n) {
      const existingFloorEth = Number(existingFloorPrice) / 1e18;
      console.log(`  ${name.padEnd(12)}: already configured (${existingFloorEth.toFixed(6)} ETH) ✓`);
      skippedConfigCount++;
      continue;
    }
    
    console.log(`  ${name.padEnd(12)}: ${floorEth.toFixed(6)} ETH (~${usdCents}¢)`);
    const tx = await nftPool.configureCollection(address, true, floorPrice, { nonce: nonce++ });
    await tx.wait(3);
    configuredCount++;
  }
  
  if (skippedConfigCount > 0) {
    console.log(`\n  ✓ Configured ${configuredCount}, skipped ${skippedConfigCount} (already set)\n`);
  } else {
    console.log("\n  ✓ All collections configured\n");
  }

  // ============================================
  // Phase 2: Mint and deposit items
  // ============================================
  console.log("--- Phase 2: Mint & Deposit Items ---\n");

  let totalMintedCount = 0;
  let totalDepositedCount = 0;

  for (const { name, address, amount } of collectionEntries) {
    console.log(`\n${name} Collection (${address})`);
    console.log(`  Target: ${amount} items in pool`);

    const collection = new ethers.Contract(address, ItemCollectionABI, signer);
    const totalMinted = Number(await collection.totalMinted());
    
    // Count how many tokens are ALREADY IN THE POOL (not just owned by us)
    let inPoolCount = 0;
    for (let tokenId = START_TOKEN_ID; tokenId <= START_TOKEN_ID + totalMinted; tokenId++) {
      const inPool = await nftPool.isNftInPool(address, tokenId);
      if (inPool) inPoolCount++;
    }
    
    console.log(`  Already in pool: ${inPoolCount}`);
    
    // If we already have enough in the pool, skip entirely
    if (inPoolCount >= amount) {
      console.log(`  ✓ Skipping (already have ${inPoolCount}/${amount} in pool)`);
      continue;
    }
    
    // Need to add more to the pool
    const needed = amount - inPoolCount;
    console.log(`  Need to add: ${needed} more items`);
    
    // Count how many we currently own (not in pool yet)
    let ownedCount = 0;
    const ownedTokenIds: number[] = [];
    for (let tokenId = START_TOKEN_ID; tokenId <= START_TOKEN_ID + totalMinted; tokenId++) {
      try {
        const owner = await collection.ownerOf(tokenId);
        const inPool = await nftPool.isNftInPool(address, tokenId);
        if (owner.toLowerCase() === signer.address.toLowerCase() && !inPool) {
          ownedCount++;
          ownedTokenIds.push(tokenId);
        }
      } catch {
        // Token doesn't exist
      }
    }
    
    // Mint more if we don't have enough
    const toMint = Math.max(0, needed - ownedCount);
    if (toMint > 0) {
      const startId = START_TOKEN_ID + totalMinted;
      console.log(`  Minting ${toMint} items (IDs: ${startId} to ${startId + toMint - 1})...`);
      const mintTx = await collection.mintBatch(signer.address, toMint, { nonce: nonce++ });
      await mintTx.wait(3);
      console.log(`  ✓ Minted (tx: ${mintTx.hash})`);
      totalMintedCount += toMint;
      
      // Add newly minted tokens to our list
      for (let i = 0; i < toMint; i++) {
        ownedTokenIds.push(startId + i);
      }
    } else {
      console.log(`  ✓ Skipping mint (already own ${ownedCount} tokens)`);
    }

    // Approve NftPool
    console.log(`  Approving NftPool...`);
    const approveTx = await collection.setApprovalForAll(infrastructure.nftPool, true, { nonce: nonce++ });
    await approveTx.wait(3);
    console.log(`  ✓ Approved (tx: ${approveTx.hash})`);

    // Verify collection is configured on NftPool
    const [isAllowed, configuredFloorPrice] = await nftPool.getCollectionInfo(address);
    if (!isAllowed) {
      throw new Error(`Collection ${address} is not allowed on NftPool. Run configure step first.`);
    }
    if (configuredFloorPrice === 0n) {
      throw new Error(`Collection ${address} has no floor price set on NftPool.`);
    }

    // Deposit only what we need
    const toDeposit = Math.min(needed, ownedTokenIds.length);
    console.log(`  Depositing ${toDeposit} items to NftPool...`);
    let depositedCount = 0;
    
    for (let i = 0; i < toDeposit; i++) {
      const tokenId = ownedTokenIds[i];
      
      // Double-check not already in pool
      const alreadyInPool = await nftPool.isNftInPool(address, tokenId);
      if (alreadyInPool) {
        process.stdout.write(`    Skipped #${tokenId} (already in pool)          \r`);
        continue;
      }
      
      const depositTx = await nftPool.deposit(address, tokenId, { nonce: nonce++ });
      await depositTx.wait(3);
      depositedCount++;
      process.stdout.write(`    Deposited #${tokenId} (${depositedCount}/${toDeposit})          \r`);
    }
    
    console.log(`  ✓ Deposited ${depositedCount} items to NftPool                    `);
    totalDepositedCount += depositedCount;
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         Summary                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("Items per rarity:");
  for (const { name, amount } of collectionEntries) {
    console.log(`  ${name.padEnd(12)}: ${amount}`);
  }
  console.log(`\nTotal items minted:    ${totalMintedCount}`);
  console.log(`Total items deposited: ${totalDepositedCount}`);
  console.log(`\n✅ Step 3 complete! Run 'yarn step4:${networkName}' next.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
