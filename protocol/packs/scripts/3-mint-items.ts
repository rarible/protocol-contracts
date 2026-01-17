import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { network } from "hardhat";

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Network configuration
const NETWORK_CONFIG: Record<string, { chainId: string }> = {
  base: { chainId: "8453" },
  sepolia: { chainId: "11155111" },
};

// Default mint amounts per rarity level (more common, fewer rare)
const DEFAULT_MINT_AMOUNTS: Record<string, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 8,
  ultraRare: 5,
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
 * Each rarity level has a different mint amount.
 *
 * Environment variables (optional overrides):
 * - MINT_COMMON:     Number of common items (default: 50)
 * - MINT_RARE:       Number of rare items (default: 30)
 * - MINT_EPIC:       Number of epic items (default: 15)
 * - MINT_LEGENDARY:  Number of legendary items (default: 8)
 * - MINT_ULTRA_RARE: Number of ultra-rare items (default: 5)
 *
 * Usage:
 *   yarn step3:base
 *   yarn step3:sepolia
 */
async function main() {
  const { ethers, networkName } = await network.connect();

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();

  // Get mint amounts from env or use defaults
  const mintAmounts = {
    common: parseInt(process.env.MINT_COMMON ?? String(DEFAULT_MINT_AMOUNTS.common)),
    rare: parseInt(process.env.MINT_RARE ?? String(DEFAULT_MINT_AMOUNTS.rare)),
    epic: parseInt(process.env.MINT_EPIC ?? String(DEFAULT_MINT_AMOUNTS.epic)),
    legendary: parseInt(process.env.MINT_LEGENDARY ?? String(DEFAULT_MINT_AMOUNTS.legendary)),
    ultraRare: parseInt(process.env.MINT_ULTRA_RARE ?? String(DEFAULT_MINT_AMOUNTS.ultraRare)),
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

  // ItemCollection ABI (minimal)
  const ItemCollectionABI = [
    "function mintBatch(address to, uint256 quantity) external",
    "function setApprovalForAll(address operator, bool approved) external",
    "function totalMinted() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
  ];

  // NftPool ABI (minimal)
  const NftPoolABI = [
    "function configureCollection(address collection, bool allowed, uint256 floorPrice) external",
    "function deposit(address collection, uint256 tokenId) external",
    "function depositBatch(address[] calldata collections, uint256[] calldata tokenIds) external",
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

  for (const { name, address, floorPrice } of collectionEntries) {
    const floorEth = Number(floorPrice) / 1e18;
    const usdCents = Math.round(floorEth * 3300 * 100);
    console.log(`  ${name.padEnd(12)}: ${floorEth.toFixed(6)} ETH (~${usdCents}¢)`);

    const tx = await nftPool.configureCollection(address, true, floorPrice, { nonce: nonce++ });
    await tx.wait();
  }
  console.log("\n  ✓ All collections configured\n");

  // ============================================
  // Phase 2: Mint and deposit items
  // ============================================
  console.log("--- Phase 2: Mint & Deposit Items ---\n");

  let totalMintedCount = 0;
  let totalDepositedCount = 0;

  for (const { name, address, amount } of collectionEntries) {
    console.log(`\n${name} Collection (${address})`);
    console.log(`  Target: ${amount} items`);

    const collection = new ethers.Contract(address, ItemCollectionABI, signer);

    // Check current balance
    const balanceBefore = await collection.balanceOf(signer.address);
    console.log(`  Current balance: ${balanceBefore}`);

    // Mint items with manual nonce
    console.log(`  Minting ${amount} items...`);
    const mintTx = await collection.mintBatch(signer.address, amount, { nonce: nonce++ });
    await mintTx.wait();
    console.log(`  ✓ Minted (tx: ${mintTx.hash})`);
    totalMintedCount += amount;

    // Approve NftPool with manual nonce
    console.log(`  Approving NftPool...`);
    const approveTx = await collection.setApprovalForAll(infrastructure.nftPool, true, { nonce: nonce++ });
    await approveTx.wait();
    console.log(`  ✓ Approved (tx: ${approveTx.hash})`);

    // Get total minted to know token IDs
    const totalMinted = await collection.totalMinted();
    const startId = Number(totalMinted) - amount + 1;
    const endId = Number(totalMinted);

    console.log(`  Token IDs: ${startId} to ${endId}`);

    // Deposit items one by one with manual nonce
    console.log(`  Depositing ${amount} items to NftPool...`);
    for (let tokenId = startId; tokenId <= endId; tokenId++) {
      const depositTx = await nftPool.deposit(address, tokenId, { nonce: nonce++ });
      await depositTx.wait();
      process.stdout.write(`    Deposited #${tokenId} (${tokenId - startId + 1}/${amount})\r`);
    }
    console.log(`  ✓ All ${amount} items deposited to NftPool                    `);
    totalDepositedCount += amount;
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
