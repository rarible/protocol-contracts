import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { network } from "hardhat";
import { NftPool__factory } from "../types/ethers-contracts/factories/contracts/NftPool__factory.js";
import { RariPack__factory } from "../types/ethers-contracts/factories/contracts/RariPack__factory.js";

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Network configuration
const NETWORK_CONFIG: Record<string, { chainId: string }> = {
  base: { chainId: "8453" },
  sepolia: { chainId: "11155111" },
};

/**
 * Step 4: Verify pool levels and show final system status.
 *
 * This step verifies that all collections are properly configured
 * and shows the final state of the pack system.
 *
 * Usage:
 *   yarn step4:base
 *   yarn step4:sepolia
 */
async function main() {
  const { ethers, networkName } = await network.connect();

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();

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
  console.log(`║         STEP 4: Verify & Status (${networkName.toUpperCase().padEnd(7)})                  ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network: ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:  ${signer.address}\n`);

  // Connect to contracts using TypeChain factories
  const nftPool = NftPool__factory.connect(infrastructure.nftPool, signer);
  const rariPack = RariPack__factory.connect(infrastructure.rariPack, signer);

  // ============================================
  // Verify Collections
  // ============================================
  console.log("--- Collection Configuration ---\n");

  const collectionEntries = [
    { name: "Common", address: collections.common },
    { name: "Rare", address: collections.rare },
    { name: "Epic", address: collections.epic },
    { name: "Legendary", address: collections.legendary },
    { name: "Ultra-Rare", address: collections.ultraRare },
  ];

  console.log("┌────────────┬──────────────────────────────────────────────┬─────────────────┬───────┐");
  console.log("│ Level      │ Collection Address                           │ Floor Price     │ Pool  │");
  console.log("├────────────┼──────────────────────────────────────────────┼─────────────────┼───────┤");

  for (const { name, address } of collectionEntries) {
    const info = await nftPool.getCollectionInfo(address);
    const floorEth = Number(info.floorPrice) / 1e18;

    console.log(`│ ${name.padEnd(10)} │ ${address} │ ${floorEth.toFixed(6).padStart(12)} ETH │   ${info.poolLevel}   │`);
  }

  console.log("└────────────┴──────────────────────────────────────────────┴─────────────────┴───────┘\n");

  // ============================================
  // Pool Status
  // ============================================
  console.log("--- Pool Status ---\n");

  const poolLevels = ["Common", "Rare", "Epic", "Legendary", "UltraRare"];

  let totalNftsInPool = 0n;
  for (let i = 0; i < poolLevels.length; i++) {
    const poolInfo = await nftPool.getPoolInfo(i);
    const poolCollections = await nftPool.getPoolCollections(i);
    const totalNfts = await nftPool.getPoolLevelSize(i);

    const lowEth = Number(poolInfo.lowPrice) / 1e18;
    const highEth =
      poolInfo.highPrice === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        ? "∞"
        : (Number(poolInfo.highPrice) / 1e18).toFixed(7);

    console.log(`${poolLevels[i]} (Level ${i}):`);
    console.log(`  Price Range:  ${lowEth.toFixed(7)} - ${highEth} ETH`);
    console.log(`  Collections:  ${poolCollections.length}`);
    console.log(`  NFTs in Pool: ${totalNfts}`);
    console.log("");

    totalNftsInPool += totalNfts;
  }

  // ============================================
  // Pack Prices
  // ============================================
  console.log("--- Pack Prices ---\n");

  const packTypes = ["Bronze", "Silver", "Gold", "Platinum"];

  for (let i = 0; i < packTypes.length; i++) {
    const price = await rariPack.packPrice(i);
    const priceEth = Number(price) / 1e18;
    const usdCents = Math.round(priceEth * 3300 * 100);
    console.log(`  ${packTypes[i].padEnd(10)}: ${priceEth.toFixed(6)} ETH (~${usdCents}¢)`);
  }
  console.log("");

  // ============================================
  // Final Summary
  // ============================================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         🎉 Pack System Ready!                              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("Deployed Contracts:");
  console.log(`  RariPack:    ${infrastructure.rariPack}`);
  console.log(`  PackManager: ${infrastructure.packManager}`);
  console.log(`  NftPool:     ${infrastructure.nftPool}\n`);

  console.log("Item Collections:");
  console.log(`  Common:      ${collections.common}`);
  console.log(`  Rare:        ${collections.rare}`);
  console.log(`  Epic:        ${collections.epic}`);
  console.log(`  Legendary:   ${collections.legendary}`);
  console.log(`  Ultra-Rare:  ${collections.ultraRare}\n`);

  console.log(`Total NFTs in Pool: ${totalNftsInPool.toString()}\n`);

  console.log("Users can now:");
  console.log("  1. Mint packs:  rariPack.mintPack{value: price}(to, packType, quantity)");
  console.log("  2. Open packs:  packManager.openPack(packTokenId)");
  console.log("  3. Claim NFTs:  packManager.claimNft(packTokenId)");
  console.log("");

  console.log("⚠️  Don't forget to add PackManager as VRF consumer at https://vrf.chain.link/");
  console.log(`    Consumer address: ${infrastructure.packManager}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
