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

// ============================================
// Type definitions for YAML configuration
// ============================================

interface CollectionEntry {
  name?: string;
  address: string;
  priceLevel: string; // ETH value as string
  tokenIds?: number[];
  poolLevel?: string;
}

interface CollectionsConfig {
  network?: string;
  chainId?: string;
  collections: CollectionEntry[];
}

/**
 * Process collections from YAML file and configure them in NftPool.
 *
 * This script:
 * 1. Configures each collection in NftPool with its floor price
 * 2. Optionally deposits NFTs to the pool
 *
 * Usage:
 *   INFRA_CONFIG=config/infrastructure.sepolia.yaml \
 *   COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \
 *   yarn process-collections:sepolia
 *
 * Environment variables:
 *   INFRA_CONFIG - Path to infrastructure YAML (for NftPool address)
 *   COLLECTIONS_CONFIG - Path to collections YAML (required)
 *   DEPOSIT_NFTS - Set to "true" to deposit NFTs to pool
 */
async function main() {
  const { ethers, networkName } = (await network.connect()) as any;

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();

  // Get YAML file paths from environment variables
  const infraYamlPath = process.env.INFRA_CONFIG;
  let collectionsYamlPath = process.env.COLLECTIONS_CONFIG;

  if (!collectionsYamlPath) {
    console.error("Usage: COLLECTIONS_CONFIG=<collections-yaml> yarn process-collections:<network>");
    console.error("Example:");
    console.error("  INFRA_CONFIG=config/infrastructure.sepolia.yaml \\");
    console.error("  COLLECTIONS_CONFIG=deployments/sepolia/2026-01-27/collections.yaml \\");
    console.error("  yarn process-collections:sepolia");
    process.exit(1);
  }

  // Resolve paths
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");

  if (!path.isAbsolute(collectionsYamlPath)) {
    collectionsYamlPath = path.resolve(projectRoot, collectionsYamlPath);
  }

  if (!fs.existsSync(collectionsYamlPath)) {
    throw new Error(`Collections YAML not found: ${collectionsYamlPath}`);
  }

  // Parse collections YAML
  const collectionsYamlContent = fs.readFileSync(collectionsYamlPath, "utf-8");
  const yamlConfig = yaml.load(collectionsYamlContent) as CollectionsConfig;

  // Get NftPool address from multiple sources
  let nftPoolAddress: string | undefined;

  // 1. Try infrastructure config YAML if provided
  if (infraYamlPath) {
    const resolvedInfraPath = path.isAbsolute(infraYamlPath)
      ? infraYamlPath
      : path.resolve(projectRoot, infraYamlPath);

    if (fs.existsSync(resolvedInfraPath)) {
      const infraYaml = yaml.load(fs.readFileSync(resolvedInfraPath, "utf-8")) as any;
      // Check if it has deployed contracts (infrastructure.yaml output)
      nftPoolAddress = infraYaml.contracts?.nftPool;
    }
  }

  // 2. Try deployed infrastructure.yaml in same folder as collections
  if (!nftPoolAddress) {
    const collectionsDir = path.dirname(collectionsYamlPath);
    const deployedInfraPath = path.join(collectionsDir, "infrastructure.yaml");
    if (fs.existsSync(deployedInfraPath)) {
      const deployedInfra = yaml.load(fs.readFileSync(deployedInfraPath, "utf-8")) as any;
      nftPoolAddress = deployedInfra.contracts?.nftPool;
    }
  }

  // 3. Fallback to ignition deployments infrastructure.json
  if (!nftPoolAddress) {
    const ignitionInfraPath = path.join(projectRoot, "ignition", "deployments", `chain-${config.chainId}`, "infrastructure.json");
    if (fs.existsSync(ignitionInfraPath)) {
      const ignitionInfra = JSON.parse(fs.readFileSync(ignitionInfraPath, "utf-8"));
      nftPoolAddress = ignitionInfra.nftPool;
    }
  }

  if (!nftPoolAddress) {
    throw new Error("NftPool address not found. Set INFRA_CONFIG or deploy infrastructure first.");
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║     PROCESS COLLECTIONS (${networkName.toUpperCase().padEnd(7)})                         ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:           ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:            ${signer.address}`);
  console.log(`Collections file:  ${collectionsYamlPath}`);
  console.log(`NftPool:           ${nftPoolAddress}`);
  console.log(`Total collections: ${yamlConfig.collections?.length ?? 0}`);

  // Options
  const depositNfts = (process.env.DEPOSIT_NFTS ?? "false").toLowerCase() === "true";

  console.log(`\nOptions:`);
  console.log(`  Deposit NFTs: ${depositNfts ? "Yes" : "No"}`);

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`\nStarting nonce: ${nonce}`);

  // Connect to NftPool
  const NftPool = await ethers.getContractFactory("NftPool");
  const nftPool = NftPool.attach(nftPoolAddress);

  // ============================================
  // Configure Collections
  // ============================================
  console.log("\n--- Configure Collections ---\n");

  if (!yamlConfig.collections || yamlConfig.collections.length === 0) {
    console.log("  No collections to process");
  } else {
    const results: Array<{
      name: string;
      address: string;
      priceLevel: string;
      priceWei: bigint;
      tokenCount: number;
      configured: boolean;
      configSkipped: boolean;
      deposited: number;
      alreadyInPool: number;
      notOwned: number;
      failed: number;
      poolLevel?: number;
    }> = [];

    for (let i = 0; i < yamlConfig.collections.length; i++) {
      const collection = yamlConfig.collections[i];
      const collectionName = collection.name ?? `Collection ${i + 1}`;
      const priceWei = ethers.parseEther(collection.priceLevel);

      console.log(`[${i + 1}/${yamlConfig.collections.length}] ${collectionName}`);
      console.log(`    Address:     ${collection.address}`);
      console.log(`    Price Level: ${collection.priceLevel} ETH`);
      console.log(`    Token IDs:   ${collection.tokenIds?.length ?? 0} tokens`);

      const result = {
        name: collectionName,
        address: collection.address,
        priceLevel: collection.priceLevel,
        priceWei,
        tokenCount: collection.tokenIds?.length ?? 0,
        configured: false,
        configSkipped: false,
        deposited: 0,
        alreadyInPool: 0,
        notOwned: 0,
        failed: 0,
        poolLevel: undefined as number | undefined,
      };

      try {
        // Configure collection with floor price (skip if already configured)
        const existingInfo = await nftPool.getCollectionInfo(collection.address);
        const alreadyConfigured = existingInfo.allowed && existingInfo.floorPrice === priceWei;
        if (alreadyConfigured) {
          result.configured = true;
          result.configSkipped = true;
          result.poolLevel = Number(existingInfo.poolLevel);
          console.log(`    ✓ Already configured - Pool Level: ${POOL_LEVEL_NAMES[result.poolLevel]} (${result.poolLevel})`);
        } else {
          console.log(`    Configuring collection...`);
          const tx = await nftPool.setCollectionFloorPrice(collection.address, priceWei, { nonce: nonce++ });
          await tx.wait();
          result.configured = true;

          // Get the assigned pool level
          const collectionInfo = await nftPool.getCollectionInfo(collection.address);
          result.poolLevel = Number(collectionInfo.poolLevel);
          console.log(`    ✓ Configured - Pool Level: ${POOL_LEVEL_NAMES[result.poolLevel]} (${result.poolLevel})`);
        }

        // Optionally deposit NFTs
        if (depositNfts && collection.tokenIds && collection.tokenIds.length > 0) {
          const totalTokens = collection.tokenIds.length;
          const logEvery = Math.max(1, Number(process.env.LOG_EVERY ?? "10"));
          console.log(`    Depositing ${totalTokens} NFTs...`);

          // Minimal ERC721 ABI for deposit operations
          const ERC721_ABI = [
            "function ownerOf(uint256 tokenId) view returns (address)",
            "function getApproved(uint256 tokenId) view returns (address)",
            "function isApprovedForAll(address owner, address operator) view returns (bool)",
            "function approve(address to, uint256 tokenId)",
            "function setApprovalForAll(address operator, bool approved)",
          ];
          const ERC721 = new ethers.Contract(collection.address, ERC721_ABI, signer);

          let processed = 0;
          let approvedForAll = await ERC721.isApprovedForAll(signer.address, nftPoolAddress);

          for (const tokenId of collection.tokenIds) {
            processed++;
            try {
              // Check if already tracked in pool
              const inPool = await nftPool.isNftInPool(collection.address, tokenId);
              if (inPool) {
                result.alreadyInPool++;
                if (processed % logEvery === 0 || processed === totalTokens) {
                  console.log(
                    `    Progress: ${processed}/${totalTokens} (deposited ${result.deposited}, in-pool ${result.alreadyInPool}, not-owned ${result.notOwned}, failed ${result.failed})`
                  );
                }
                continue;
              }

              // Check ownership
              const owner = await ERC721.ownerOf(tokenId);
              if (owner.toLowerCase() === nftPoolAddress.toLowerCase()) {
                result.alreadyInPool++;
                if (processed % logEvery === 0 || processed === totalTokens) {
                  console.log(
                    `    Progress: ${processed}/${totalTokens} (deposited ${result.deposited}, in-pool ${result.alreadyInPool}, not-owned ${result.notOwned}, failed ${result.failed})`
                  );
                }
                continue;
              }
              if (owner.toLowerCase() !== signer.address.toLowerCase()) {
                result.notOwned++;
                if (processed % logEvery === 0 || processed === totalTokens) {
                  console.log(
                    `    Progress: ${processed}/${totalTokens} (deposited ${result.deposited}, in-pool ${result.alreadyInPool}, not-owned ${result.notOwned}, failed ${result.failed})`
                  );
                }
                continue;
              }

              // Check/set approval
              if (!approvedForAll) {
                const approved = await ERC721.getApproved(tokenId);
                if (approved.toLowerCase() !== nftPoolAddress.toLowerCase()) {
                  const approveTx = await ERC721.approve(nftPoolAddress, tokenId, { nonce: nonce++ });
                  await approveTx.wait();
                }
                approvedForAll = await ERC721.isApprovedForAll(signer.address, nftPoolAddress);
              }

              // Deposit to pool
              const depositTx = await nftPool.deposit(collection.address, tokenId, { nonce: nonce++ });
              await depositTx.wait();
              result.deposited++;
              if (processed % logEvery === 0 || processed === totalTokens) {
                console.log(
                  `    Progress: ${processed}/${totalTokens} (deposited ${result.deposited}, in-pool ${result.alreadyInPool}, not-owned ${result.notOwned}, failed ${result.failed})`
                );
              }
            } catch {
              // Skip failed deposits
              result.failed++;
              if (processed % logEvery === 0 || processed === totalTokens) {
                console.log(
                  `    Progress: ${processed}/${totalTokens} (deposited ${result.deposited}, in-pool ${result.alreadyInPool}, not-owned ${result.notOwned}, failed ${result.failed})`
                );
              }
            }
          }
          console.log(
            `    Deposited: ${result.deposited}/${totalTokens} NFTs (in-pool: ${result.alreadyInPool}, not-owned: ${result.notOwned}, failed: ${result.failed})`
          );
        }
      } catch (err: any) {
        console.log(`    ✗ Failed: ${err.message}`);
      }

      results.push(result);
      console.log("");
    }

    // Summary table
    console.log("╔════════════════════════════════════════════════════════════════════════════════════╗");
    console.log("║         Processing Complete                                                         ║");
    console.log("╚════════════════════════════════════════════════════════════════════════════════════╝\n");

    console.log("┌─────────────────────────────┬──────────────────────┬───────────┬────────────┬──────┐");
    console.log("│ Collection                  │ Address              │ Price ETH │ Pool Level │ NFTs │");
    console.log("├─────────────────────────────┼──────────────────────┼───────────┼────────────┼──────┤");

    for (const result of results) {
      const name = result.name.substring(0, 26).padEnd(26);
      const addr = `${result.address.substring(0, 6)}...${result.address.substring(38)}`;
      const price = result.priceLevel.padStart(9);
      const level = result.poolLevel !== undefined ? POOL_LEVEL_NAMES[result.poolLevel].padEnd(10) : "N/A".padEnd(10);
      const nfts = depositNfts ? result.deposited.toString().padStart(4) : "-".padStart(4);
      const status = result.configured ? "✓" : "✗";

      console.log(`│ ${status} ${name} │ ${addr} │ ${price} │ ${level} │ ${nfts} │`);
    }

    console.log("└─────────────────────────────┴──────────────────────┴───────────┴────────────┴──────┘\n");

    const configured = results.filter((r) => r.configured).length;
    const totalDeposited = results.reduce((sum, r) => sum + r.deposited, 0);
    const totalAlreadyInPool = results.reduce((sum, r) => sum + r.alreadyInPool, 0);
    const totalNotOwned = results.reduce((sum, r) => sum + r.notOwned, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    console.log(`Configured: ${configured}/${results.length} collections`);
    if (depositNfts) {
      console.log(`Deposited:  ${totalDeposited} NFTs total`);
      console.log(`In-pool:    ${totalAlreadyInPool} NFTs already deposited`);
      console.log(`Not owned:  ${totalNotOwned} NFTs (skipped)`);
      console.log(`Failed:     ${totalFailed} NFTs`);
    }

    // Save results
    const collectionsDir = path.dirname(collectionsYamlPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(collectionsDir, `processed-${timestamp}.json`);

    const outputData = {
      timestamp: new Date().toISOString(),
      network: networkName,
      chainId: config.chainId,
      collectionsFile: collectionsYamlPath,
      nftPool: nftPoolAddress,
      depositEnabled: depositNfts,
      results: results.map((r) => ({
        ...r,
        priceWei: r.priceWei.toString(),
        poolLevelName: r.poolLevel !== undefined ? POOL_LEVEL_NAMES[r.poolLevel] : null,
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
  }

  console.log("\n✅ Processing complete!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
