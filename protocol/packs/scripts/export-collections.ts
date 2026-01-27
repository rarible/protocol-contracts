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
const NETWORK_CONFIG: Record<string, { chainId: string }> = {
  base: { chainId: "8453" },
  sepolia: { chainId: "11155111" },
};

// Pool level names
const POOL_LEVEL_NAMES = ["Common", "Rare", "Epic", "Legendary", "UltraRare"];

/**
 * Export collections configuration to YAML format.
 * Reads from deployed item_collections.json and generates a YAML file
 * that can be used as input for the process-collections script.
 *
 * Usage:
 *   npx hardhat run scripts/export-collections.ts --network base
 *   yarn export-collections:base
 *
 * Output: Creates a YAML file in deployments/<network>/<date>/collections-export.yaml
 */
async function main() {
  const { ethers, networkName } = (await network.connect()) as any;

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

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║     EXPORT COLLECTIONS TO YAML (${networkName.toUpperCase().padEnd(7)})                  ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network: ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:  ${signer.address}\n`);

  // Check what files exist
  const hasCollections = fs.existsSync(collectionsPath);
  const hasInfra = fs.existsSync(infraPath);

  let collections: Record<string, string> = {};
  let infrastructure: Record<string, any> = {};

  if (hasCollections) {
    collections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
    console.log(`Found collections: ${Object.keys(collections).length}`);
  } else {
    console.log("No item_collections.json found - will create template");
  }

  if (hasInfra) {
    infrastructure = JSON.parse(fs.readFileSync(infraPath, "utf-8"));
    console.log(`Found infrastructure at: ${infraPath}`);
  } else {
    console.log("No infrastructure.json found - will create template");
  }

  // Build collection entries
  const collectionEntries: any[] = [];

  // ItemCollection ABI for querying token info
  const ItemCollectionABI = [
    "function totalMinted() external view returns (uint256)",
    "function name() external view returns (string)",
  ];

  // NftPool ABI for querying collection info
  const NftPoolABI = [
    "function getCollectionInfo(address collection) external view returns (bool allowed, uint256 floorPrice, uint8 poolLevel)",
    "function isNftInPool(address collection, uint256 tokenId) external view returns (bool)",
    "function getPoolInfo(uint8 level) external view returns (uint256 lowPrice, uint256 highPrice)",
  ];

  // PackManager ABI for querying config
  const PackManagerABI = [
    "function instantCashEnabled() external view returns (bool)",
    "function treasuryThreshold() external view returns (uint256)",
    "function payoutTreasury() external view returns (address)",
    "function vrfCoordinator() external view returns (address)",
    "function vrfSubscriptionId() external view returns (uint256)",
    "function vrfKeyHash() external view returns (bytes32)",
    "function vrfCallbackGasLimit() external view returns (uint32)",
    "function vrfRequestConfirmations() external view returns (uint16)",
    "function getPackProbabilities(uint8 packType) external view returns (uint16 ultraRare, uint16 legendary, uint16 epic, uint16 rare)",
  ];

  let nftPool: any = null;
  let packManager: any = null;
  let poolRanges: any[] = [];
  let packManagerSettings: any = {};

  if (hasInfra && infrastructure.nftPool) {
    nftPool = new ethers.Contract(infrastructure.nftPool, NftPoolABI, signer);

    // Get pool ranges
    console.log("\nReading pool ranges...");
    for (let i = 0; i < 5; i++) {
      const [lowPrice, highPrice] = await nftPool.getPoolInfo(i);
      poolRanges.push({
        level: POOL_LEVEL_NAMES[i],
        lowPriceWei: lowPrice.toString(),
        highPriceWei: highPrice.toString(),
        lowPriceEth: parseFloat((Number(lowPrice) / 1e18).toFixed(8)),
        highPriceEth:
          highPrice.toString() === "115792089237316195423570985008687907853269984665640564039457584007913129639935"
            ? "infinity"
            : parseFloat((Number(highPrice) / 1e18).toFixed(8)),
      });
    }
  }

  if (hasInfra && infrastructure.packManager) {
    packManager = new ethers.Contract(infrastructure.packManager, PackManagerABI, signer);

    console.log("Reading PackManager settings...");
    try {
      const instantCashEnabled = await packManager.instantCashEnabled();
      const treasuryThreshold = await packManager.treasuryThreshold();
      const payoutTreasury = await packManager.payoutTreasury();
      const vrfCoordinator = await packManager.vrfCoordinator();
      const vrfSubscriptionId = await packManager.vrfSubscriptionId();
      const vrfKeyHash = await packManager.vrfKeyHash();
      const vrfCallbackGasLimit = await packManager.vrfCallbackGasLimit();
      const vrfRequestConfirmations = await packManager.vrfRequestConfirmations();

      packManagerSettings = {
        instantCashEnabled,
        treasuryThresholdWei: treasuryThreshold.toString(),
        treasuryThresholdEth: parseFloat((Number(treasuryThreshold) / 1e18).toFixed(6)),
        payoutTreasury,
        vrf: {
          coordinator: vrfCoordinator,
          subscriptionId: vrfSubscriptionId.toString(),
          keyHash: vrfKeyHash,
          callbackGasLimit: Number(vrfCallbackGasLimit),
          requestConfirmations: Number(vrfRequestConfirmations),
        },
      };

      // Get pack probabilities
      const packTypes = ["Bronze", "Silver", "Gold", "Platinum"];
      const probabilities: any = {};

      for (let i = 0; i < packTypes.length; i++) {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(i);
        probabilities[packTypes[i].toLowerCase()] = {
          ultraRare: Number(ultraRare),
          legendary: Number(legendary),
          epic: Number(epic),
          rare: Number(rare),
        };
      }
      packManagerSettings.probabilities = probabilities;
    } catch (err: any) {
      console.log(`  Warning: Could not read some PackManager settings: ${err.message}`);
    }
  }

  // Process each collection
  const START_TOKEN_ID = 1; // ERC721A starts at 1

  if (hasCollections) {
    const collectionKeys = ["common", "rare", "epic", "legendary", "ultraRare"];
    const collectionNames = ["Common", "Rare", "Epic", "Legendary", "Ultra-Rare"];

    for (let i = 0; i < collectionKeys.length; i++) {
      const key = collectionKeys[i];
      const name = collectionNames[i];
      const address = collections[key];

      if (!address) continue;

      console.log(`\nProcessing ${name} collection: ${address}`);

      const entry: any = {
        name,
        address,
        priceLevel: "0", // Will be populated from NftPool
        tokenIds: [],
      };

      try {
        const collection = new ethers.Contract(address, ItemCollectionABI, signer);

        // Get collection info from NftPool if available
        if (nftPool) {
          const [allowed, floorPrice, poolLevel] = await nftPool.getCollectionInfo(address);
          entry.priceLevel = (Number(floorPrice) / 1e18).toFixed(8);
          entry.poolLevel = POOL_LEVEL_NAMES[poolLevel];
          entry.allowed = allowed;

          // Get token IDs in pool
          const totalMinted = Number(await collection.totalMinted());
          console.log(`  Total minted: ${totalMinted}`);

          const tokenIds: number[] = [];
          for (let tokenId = START_TOKEN_ID; tokenId < START_TOKEN_ID + totalMinted; tokenId++) {
            try {
              const inPool = await nftPool.isNftInPool(address, tokenId);
              if (inPool) {
                tokenIds.push(tokenId);
              }
            } catch {
              // Token might not exist
            }
          }
          entry.tokenIds = tokenIds;
          console.log(`  In pool: ${tokenIds.length}`);
        }
      } catch (err: any) {
        console.log(`  Warning: Could not read collection info: ${err.message}`);
      }

      collectionEntries.push(entry);
    }
  }

  // Build the YAML structure
  const yamlData: any = {
    network: networkName,
    chainId: config.chainId,
    exportedAt: new Date().toISOString(),

    contracts: {
      nftPool: infrastructure.nftPool ?? "0x0000000000000000000000000000000000000000",
      packManager: infrastructure.packManager ?? "0x0000000000000000000000000000000000000000",
      rariPack: infrastructure.rariPack ?? "0x0000000000000000000000000000000000000000",
    },

    poolRanges:
      poolRanges.length > 0
        ? poolRanges
        : [
            { level: "Common", lowPriceEth: 0, highPriceEth: 0.05325 },
            { level: "Rare", lowPriceEth: 0.05325, highPriceEth: 0.213 },
            { level: "Epic", lowPriceEth: 0.213, highPriceEth: 1.065 },
            { level: "Legendary", lowPriceEth: 1.065, highPriceEth: 5.325 },
            { level: "UltraRare", lowPriceEth: 5.325, highPriceEth: "infinity" },
          ],

    packManager:
      Object.keys(packManagerSettings).length > 0
        ? packManagerSettings
        : {
            instantCashEnabled: false,
            treasuryThresholdEth: 5.0,
            payoutTreasury: "0x0000000000000000000000000000000000000000",
            vrf: {
              coordinator: "0x0000000000000000000000000000000000000000",
              subscriptionId: "0",
              keyHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
              callbackGasLimit: 500000,
              requestConfirmations: 3,
            },
            probabilities: {
              bronze: { ultraRare: 0, legendary: 20, epic: 120, rare: 620 },
              silver: { ultraRare: 0, legendary: 50, epic: 350, rare: 1350 },
              gold: { ultraRare: 0, legendary: 100, epic: 600, rare: 2100 },
              platinum: { ultraRare: 50, legendary: 250, epic: 950, rare: 2950 },
            },
          },

    collections:
      collectionEntries.length > 0
        ? collectionEntries
        : [
            {
              name: "Example Collection",
              address: "0x0000000000000000000000000000000000000000",
              priceLevel: "0.01",
              tokenIds: [1, 2, 3],
            },
          ],
  };

  // Create output directory
  const dateStr = new Date().toISOString().split("T")[0];
  const outputDir = path.join(projectRoot, "deployments", networkName, dateStr);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate YAML with comments
  const yamlContent = `# NFT Pack System Configuration
# Generated: ${new Date().toISOString()}
# Network: ${networkName} (chainId: ${config.chainId})
#
# This file can be used as input for:
#   - yarn process-collections:<network> --config <this-file>
#
# Edit the values below and run the process script to apply changes.

${yaml.dump(yamlData, { lineWidth: 120, noRefs: true, sortKeys: false })}`;

  const outputPath = path.join(outputDir, "collections-export.yaml");
  fs.writeFileSync(outputPath, yamlContent);

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         Export Complete                                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`YAML exported to: ${outputPath}`);
  console.log(`\nCollections: ${collectionEntries.length}`);
  console.log(`Pool ranges: ${poolRanges.length}`);
  console.log(`PackManager settings: ${Object.keys(packManagerSettings).length > 0 ? "Yes" : "Template"}`);

  console.log(`\nTo apply changes, edit the YAML and run:`);
  console.log(`  yarn process-collections:${networkName} --config ${outputPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
