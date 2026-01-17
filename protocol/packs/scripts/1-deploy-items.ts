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
const NETWORK_CONFIG: Record<string, { chainId: string; owner: string; metadataBase: string }> = {
  base: {
    chainId: "8453",
    owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f",
    metadataBase: "https://rarible-drops.s3.filebase.com/Base/item",
  },
  sepolia: {
    chainId: "11155111",
    owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f",
    metadataBase: "https://rarible-drops.s3.filebase.com/Sepolia/item",
  },
};

/**
 * Step 1: Deploy 5 ItemCollection contracts (Common, Rare, Epic, Legendary, UltraRare).
 * Uses direct ethers deployment with manual nonce management.
 *
 * Environment variables:
 * - ITEM_COLLECTION_OWNER (optional): Owner address for all collections
 *
 * Usage:
 *   yarn step1:base
 *   yarn step1:sepolia
 */
async function main() {
  const { ethers, networkName } = await network.connect();

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();
  const owner = process.env.ITEM_COLLECTION_OWNER ?? config.owner;

  // Metadata URIs
  const commonUri = process.env.ITEM_URI_COMMON ?? `${config.metadataBase}/common.json`;
  const rareUri = process.env.ITEM_URI_RARE ?? `${config.metadataBase}/rare.json`;
  const epicUri = process.env.ITEM_URI_EPIC ?? `${config.metadataBase}/epic.json`;
  const legendaryUri = process.env.ITEM_URI_LEGENDARY ?? `${config.metadataBase}/legendary.json`;
  const ultraRareUri = process.env.ITEM_URI_ULTRARARE ?? `${config.metadataBase}/ultra-rare.json`;

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║         STEP 1: Deploy Item Collections (${networkName.toUpperCase().padEnd(7)})        ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network: ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:  ${signer.address}`);
  console.log(`Owner:   ${owner}`);
  console.log("\nMetadata URIs:");
  console.log(`  Common:    ${commonUri}`);
  console.log(`  Rare:      ${rareUri}`);
  console.log(`  Epic:      ${epicUri}`);
  console.log(`  Legendary: ${legendaryUri}`);
  console.log(`  UltraRare: ${ultraRareUri}`);
  console.log("");

  // Get ItemCollection contract factory
  const ItemCollection = await ethers.getContractFactory("ItemCollection");

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`Starting nonce: ${nonce}\n`);

  const collectionsToDeployConfigs = [
    { name: "Common", symbol: "COMMON", uri: commonUri },
    { name: "Rare", symbol: "RARE", uri: rareUri },
    { name: "Epic", symbol: "EPIC", uri: epicUri },
    { name: "Legendary", symbol: "LEGEND", uri: legendaryUri },
    { name: "UltraRare", symbol: "ULTRARARE", uri: ultraRareUri },
  ];

  const deployedCollections: Record<string, string> = {};

  for (const collConfig of collectionsToDeployConfigs) {
    console.log(`Deploying ${collConfig.name} Collection...`);
    console.log(`  Name: ${collConfig.name} Pool Item`);
    console.log(`  Symbol: ${collConfig.symbol}`);
    console.log(`  URI: ${collConfig.uri}`);
    console.log(`  Nonce: ${nonce}`);

    const contract = await ItemCollection.deploy(
      `${collConfig.name} Pool Item`,
      collConfig.symbol,
      collConfig.uri,
      owner,
      { nonce }
    );

    console.log(`  Tx hash: ${contract.deploymentTransaction()?.hash}`);
    console.log(`  Waiting for confirmation...`);

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`  ✓ Deployed at: ${address}\n`);

    deployedCollections[collConfig.name.toLowerCase()] = address;
    nonce++;
  }

  // Save deployed addresses
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const deploymentsDir = path.join(projectRoot, "ignition", "deployments", `chain-${config.chainId}`);

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save collections
  const collections = {
    common: deployedCollections.common,
    rare: deployedCollections.rare,
    epic: deployedCollections.epic,
    legendary: deployedCollections.legendary,
    ultraRare: deployedCollections.ultrarare,
  };

  const collectionsPath = path.join(deploymentsDir, "item_collections.json");
  fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2));

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         Deployed Item Collections                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Common:    ${collections.common}`);
  console.log(`Rare:      ${collections.rare}`);
  console.log(`Epic:      ${collections.epic}`);
  console.log(`Legendary: ${collections.legendary}`);
  console.log(`UltraRare: ${collections.ultraRare}`);

  console.log(`\nSaved collection addresses to: ${collectionsPath}`);
  console.log(`\n✅ Step 1 complete! Run 'yarn step2:${networkName}' next.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
