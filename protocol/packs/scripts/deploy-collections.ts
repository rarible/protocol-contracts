import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { network } from "hardhat";
import * as yaml from "js-yaml";

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Network configuration
const NETWORK_CONFIG: Record<
  string,
  {
    chainId: string;
    owner: string;
    metadataBase: string;
    mintAmounts: { common: number; rare: number; epic: number; legendary: number; ultraRare: number };
  }
> = {
  base: {
    chainId: "8453",
    owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f",
    metadataBase: "https://rarible-drops.s3.filebase.com/Base/item",
    mintAmounts: { common: 10, rare: 8, epic: 5, legendary: 3, ultraRare: 2 },
  },
  sepolia: {
    chainId: "11155111",
    owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f",
    metadataBase: "https://rarible-drops.s3.filebase.com/Sepolia/item",
    mintAmounts: { common: 50, rare: 30, epic: 15, legendary: 8, ultraRare: 5 },
  },
};

// Default floor prices (in ETH)
const DEFAULT_FLOOR_PRICES: Record<string, string> = {
  common: "0.01",
  rare: "0.08",
  epic: "0.35",
  legendary: "2.5",
  ultraRare: "8.0",
};

// Pool level names
const POOL_LEVEL_NAMES = ["Common", "Rare", "Epic", "Legendary", "UltraRare"];

/**
 * Get date string for folder naming (YYYY-MM-DD)
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Deploy and mint item collections, then output YAML configuration.
 *
 * This script:
 * 1. Deploys 5 ItemCollection contracts (Common, Rare, Epic, Legendary, UltraRare)
 * 2. Mints items to each collection
 * 3. Outputs a YAML file that can be used by process-collections.ts
 *
 * The output YAML contains:
 * - Collection addresses
 * - Floor prices
 * - Minted token IDs
 *
 * Usage:
 *   npx hardhat run scripts/deploy-collections.ts --network base
 *   yarn deploy-collections:base
 *
 * Environment variables:
 *   ITEM_COLLECTION_OWNER - Owner address for all collections
 *   MINT_COMMON, MINT_RARE, MINT_EPIC, MINT_LEGENDARY, MINT_ULTRA_RARE - Mint amounts
 *   FLOOR_COMMON, FLOOR_RARE, FLOOR_EPIC, FLOOR_LEGENDARY, FLOOR_ULTRA_RARE - Floor prices in ETH
 *   SKIP_DEPLOY - Set to "true" to skip deployment (use existing collections from input YAML)
 *   SKIP_MINT - Set to "true" to skip minting
 *   INPUT_YAML - Path to existing YAML file with collection addresses
 */
async function main() {
  const { ethers, networkName } = (await network.connect()) as any;

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();
  const owner = process.env.ITEM_COLLECTION_OWNER ?? config.owner;

  // Options
  const skipDeploy = (process.env.SKIP_DEPLOY ?? "false").toLowerCase() === "true";
  const skipMint = (process.env.SKIP_MINT ?? "false").toLowerCase() === "true";
  const inputYamlPath = process.env.INPUT_YAML;

  // Get mint amounts from env or use network defaults
  const defaults = config.mintAmounts;
  const mintAmounts = {
    common: parseInt(process.env.MINT_COMMON ?? String(defaults.common)),
    rare: parseInt(process.env.MINT_RARE ?? String(defaults.rare)),
    epic: parseInt(process.env.MINT_EPIC ?? String(defaults.epic)),
    legendary: parseInt(process.env.MINT_LEGENDARY ?? String(defaults.legendary)),
    ultraRare: parseInt(process.env.MINT_ULTRA_RARE ?? String(defaults.ultraRare)),
  };

  // Get floor prices from env or use defaults
  const floorPrices = {
    common: process.env.FLOOR_COMMON ?? DEFAULT_FLOOR_PRICES.common,
    rare: process.env.FLOOR_RARE ?? DEFAULT_FLOOR_PRICES.rare,
    epic: process.env.FLOOR_EPIC ?? DEFAULT_FLOOR_PRICES.epic,
    legendary: process.env.FLOOR_LEGENDARY ?? DEFAULT_FLOOR_PRICES.legendary,
    ultraRare: process.env.FLOOR_ULTRA_RARE ?? DEFAULT_FLOOR_PRICES.ultraRare,
  };

  // Metadata URIs
  const metadataUris = {
    common: process.env.ITEM_URI_COMMON ?? `${config.metadataBase}/common.json`,
    rare: process.env.ITEM_URI_RARE ?? `${config.metadataBase}/rare.json`,
    epic: process.env.ITEM_URI_EPIC ?? `${config.metadataBase}/epic.json`,
    legendary: process.env.ITEM_URI_LEGENDARY ?? `${config.metadataBase}/legendary.json`,
    ultraRare: process.env.ITEM_URI_ULTRARARE ?? `${config.metadataBase}/ultra-rare.json`,
  };

  // Create output directory
  const dateStr = getDateString();
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const outputDir = path.join(projectRoot, "deployments", networkName, dateStr);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║     DEPLOY & MINT COLLECTIONS (${networkName.toUpperCase().padEnd(7)})                   ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:      ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:       ${signer.address}`);
  console.log(`Owner:        ${owner}`);
  console.log(`Output Dir:   ${outputDir}`);
  console.log(`\nOptions:`);
  console.log(`  Skip Deploy: ${skipDeploy}`);
  console.log(`  Skip Mint:   ${skipMint}`);
  console.log(`  Input YAML:  ${inputYamlPath ?? "None"}`);

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`\nStarting nonce: ${nonce}`);

  // Collection configs
  const collectionConfigs = [
    { key: "common", name: "Common", symbol: "COMMON", uri: metadataUris.common, amount: mintAmounts.common, floor: floorPrices.common },
    { key: "rare", name: "Rare", symbol: "RARE", uri: metadataUris.rare, amount: mintAmounts.rare, floor: floorPrices.rare },
    { key: "epic", name: "Epic", symbol: "EPIC", uri: metadataUris.epic, amount: mintAmounts.epic, floor: floorPrices.epic },
    { key: "legendary", name: "Legendary", symbol: "LEGEND", uri: metadataUris.legendary, amount: mintAmounts.legendary, floor: floorPrices.legendary },
    { key: "ultraRare", name: "UltraRare", symbol: "ULTRARARE", uri: metadataUris.ultraRare, amount: mintAmounts.ultraRare, floor: floorPrices.ultraRare },
  ];

  // Load existing addresses from input YAML if provided
  let existingAddresses: Record<string, string> = {};
  if (inputYamlPath && fs.existsSync(inputYamlPath)) {
    const inputYaml = yaml.load(fs.readFileSync(inputYamlPath, "utf-8")) as any;
    if (inputYaml.collections) {
      for (const coll of inputYaml.collections) {
        const key = coll.name?.toLowerCase().replace("-", "").replace(" ", "") ?? "";
        if (coll.address && key) {
          existingAddresses[key] = coll.address;
        }
      }
    }
    console.log(`\nLoaded ${Object.keys(existingAddresses).length} existing addresses from input YAML`);
  }

  // ============================================
  // Phase 1: Deploy Collections
  // ============================================
  console.log("\n--- Phase 1: Deploy Collections ---\n");

  const deployedCollections: Record<string, string> = {};
  const ItemCollection = await ethers.getContractFactory("ItemCollection");

  // ERC721A _startTokenId for ItemCollection
  const START_TOKEN_ID = 1;

  // ItemCollection ABI for minting
  const ItemCollectionABI = [
    "function mintBatch(address to, uint256 quantity) external",
    "function totalMinted() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
  ];

  for (const collConfig of collectionConfigs) {
    const existingAddr = existingAddresses[collConfig.key] ?? existingAddresses[collConfig.name.toLowerCase()];

    if (skipDeploy && existingAddr) {
      console.log(`${collConfig.name}: Using existing address ${existingAddr}`);
      deployedCollections[collConfig.key] = existingAddr;
      continue;
    }

    if (skipDeploy) {
      throw new Error(`SKIP_DEPLOY=true but no existing address for ${collConfig.name}`);
    }

    console.log(`Deploying ${collConfig.name} Collection...`);
    console.log(`  Name:   ${collConfig.name} Pool Item`);
    console.log(`  Symbol: ${collConfig.symbol}`);
    console.log(`  URI:    ${collConfig.uri}`);

    const contract = await ItemCollection.deploy(
      `${collConfig.name} Pool Item`,
      collConfig.symbol,
      collConfig.uri,
      owner,
      { nonce: nonce++ }
    );

    console.log(`  Tx: ${contract.deploymentTransaction()?.hash}`);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`  ✓ Deployed: ${address}\n`);

    deployedCollections[collConfig.key] = address;
  }

  // ============================================
  // Phase 2: Mint Items
  // ============================================
  console.log("\n--- Phase 2: Mint Items ---\n");

  const mintedTokens: Record<string, number[]> = {};

  if (skipMint) {
    console.log("Skipping minting (SKIP_MINT=true)\n");
    for (const collConfig of collectionConfigs) {
      mintedTokens[collConfig.key] = [];
    }
  } else {
    console.log("Mint amounts:");
    for (const collConfig of collectionConfigs) {
      console.log(`  ${collConfig.name.padEnd(10)}: ${collConfig.amount}`);
    }
    console.log("");

    for (const collConfig of collectionConfigs) {
      const address = deployedCollections[collConfig.key];
      const collection = new ethers.Contract(address, ItemCollectionABI, signer);

      console.log(`${collConfig.name} Collection (${address})`);

      // Check existing minted tokens
      const totalMinted = Number(await collection.totalMinted());
      console.log(`  Already minted: ${totalMinted}`);

      // Calculate how many more to mint
      const toMint = Math.max(0, collConfig.amount - totalMinted);

      const tokenIds: number[] = [];

      if (toMint > 0) {
        const startId = START_TOKEN_ID + totalMinted;
        console.log(`  Minting ${toMint} items (IDs: ${startId} to ${startId + toMint - 1})...`);

        const mintTx = await collection.mintBatch(signer.address, toMint, { nonce: nonce++ });
        await mintTx.wait();
        console.log(`  ✓ Minted (tx: ${mintTx.hash})`);

        // Record minted token IDs
        for (let i = 0; i < toMint; i++) {
          tokenIds.push(startId + i);
        }
      } else {
        console.log(`  ✓ Skipping mint (already have ${totalMinted})`);
      }

      // Also include previously minted tokens owned by signer
      for (let tokenId = START_TOKEN_ID; tokenId < START_TOKEN_ID + totalMinted; tokenId++) {
        try {
          const tokenOwner = await collection.ownerOf(tokenId);
          if (tokenOwner.toLowerCase() === signer.address.toLowerCase()) {
            if (!tokenIds.includes(tokenId)) {
              tokenIds.push(tokenId);
            }
          }
        } catch {
          // Token doesn't exist or burned
        }
      }

      mintedTokens[collConfig.key] = tokenIds.sort((a, b) => a - b);
      console.log(`  Total owned: ${tokenIds.length} tokens\n`);
    }
  }

  // ============================================
  // Phase 3: Generate YAML Output
  // ============================================
  console.log("--- Phase 3: Generate YAML Output ---\n");

  // Build collections array for YAML
  const collectionsYaml = collectionConfigs.map((collConfig, index) => ({
    name: `${collConfig.name} Pool Item`,
    address: deployedCollections[collConfig.key],
    priceLevel: collConfig.floor,
    poolLevel: POOL_LEVEL_NAMES[index],
    tokenIds: mintedTokens[collConfig.key],
  }));

  // Build YAML structure - collections only
  const yamlData = {
    network: networkName,
    chainId: config.chainId,
    generatedAt: new Date().toISOString(),
    deployer: signer.address,
    owner,
    collections: collectionsYaml,
  };

  // Generate YAML content with header comment
  const yamlContent = `# NFT Pack System - Collections
# ==============================
# Generated: ${new Date().toISOString()}
# Network: ${networkName} (chainId: ${config.chainId})
#
# This file contains deployed collection addresses and minted token IDs.
# Use this file as input for process-collections script.

${yaml.dump(yamlData, { lineWidth: 120, noRefs: true, sortKeys: false })}`;

  // Save YAML output
  const outputPath = path.join(outputDir, "collections.yaml");
  fs.writeFileSync(outputPath, yamlContent);

  // Also save to legacy JSON location for backward compatibility
  const legacyDir = path.join(projectRoot, "ignition", "deployments", `chain-${config.chainId}`);
  if (!fs.existsSync(legacyDir)) {
    fs.mkdirSync(legacyDir, { recursive: true });
  }

  const legacyCollections = {
    common: deployedCollections.common,
    rare: deployedCollections.rare,
    epic: deployedCollections.epic,
    legendary: deployedCollections.legendary,
    ultraRare: deployedCollections.ultraRare,
  };
  fs.writeFileSync(path.join(legacyDir, "item_collections.json"), JSON.stringify(legacyCollections, null, 2));

  // ============================================
  // Summary
  // ============================================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         Collections Deployed & Minted                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("Deployed Collections:");
  for (const collConfig of collectionConfigs) {
    const addr = deployedCollections[collConfig.key];
    const tokens = mintedTokens[collConfig.key];
    console.log(`  ${collConfig.name.padEnd(10)}: ${addr} (${tokens.length} tokens)`);
  }

  console.log(`\nYAML output: ${outputPath}`);
  console.log(`Legacy JSON: ${path.join(legacyDir, "item_collections.json")}`);

  console.log(`
Next step:
  Apply configuration to NftPool:
  yarn process-collections:${networkName} --config ${outputPath}
`);

  console.log("✅ Done!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
