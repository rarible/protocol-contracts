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

// Network configuration (defaults)
const NETWORK_CONFIG: Record<string, { chainId: string }> = {
  base: { chainId: "8453" },
  sepolia: { chainId: "11155111" },
};

// Pack type enum
const PackType = { Bronze: 0, Silver: 1, Gold: 2, Platinum: 3 };

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

// ============================================
// Type definitions for YAML configuration
// ============================================

interface PackPrices {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

interface PackUris {
  bronze?: string;
  silver?: string;
  gold?: string;
  platinum?: string;
}

interface PackDescriptions {
  bronze?: string;
  silver?: string;
  gold?: string;
  platinum?: string;
}

interface RariPackConfig {
  network?: string;
  chainId?: string;
  owner: string;
  treasury: string;
  name?: string;
  symbol?: string;
  prices: PackPrices;
  uris?: PackUris;
  descriptions?: PackDescriptions;
}

/**
 * Deploy RariPack using YAML configuration.
 *
 * Reads configuration from YAML file specified by RARIPACK_CONFIG env var.
 * Deploys RariPack implementation and proxy, then configures prices, URIs, and descriptions.
 *
 * Usage:
 *   RARIPACK_CONFIG=config/raripack.sepolia.yaml yarn deploy:raripack:sepolia
 *   RARIPACK_CONFIG=config/raripack.base.yaml yarn deploy:raripack:base
 */
async function main() {
  const { ethers, networkName } = (await network.connect()) as any;

  const networkConfig = NETWORK_CONFIG[networkName];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  // Load YAML configuration
  const configPath = process.env.RARIPACK_CONFIG;
  if (!configPath) {
    throw new Error("RARIPACK_CONFIG environment variable must be set to the path of the YAML config file");
  }

  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const fullConfigPath = path.isAbsolute(configPath) ? configPath : path.join(projectRoot, configPath);

  if (!fs.existsSync(fullConfigPath)) {
    throw new Error(`Configuration file not found: ${fullConfigPath}`);
  }

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║         Deploy RariPack (${networkName.toUpperCase().padEnd(7)})                         ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  console.log(`Loading configuration from: ${fullConfigPath}\n`);

  const configContent = fs.readFileSync(fullConfigPath, "utf-8");
  const config = yaml.load(configContent) as RariPackConfig;

  // Validate required fields
  if (!config.owner) throw new Error("Missing required field: owner");
  if (!config.treasury) throw new Error("Missing required field: treasury");
  if (!config.prices) throw new Error("Missing required field: prices");

  const [signer] = await ethers.getSigners();
  const owner = config.owner;
  const treasury = config.treasury;
  const packName = config.name ?? "Rari Pack";
  const packSymbol = config.symbol ?? "RPACK";

  console.log(`Network:  ${networkName} (chainId: ${networkConfig.chainId})`);
  console.log(`Signer:   ${signer.address}`);
  console.log(`Owner:    ${owner}`);
  console.log(`Treasury: ${treasury}`);
  console.log(`Name:     ${packName}`);
  console.log(`Symbol:   ${packSymbol}`);
  console.log("");

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`Starting nonce: ${nonce}\n`);

  // Get contract factories
  const RariPack = await ethers.getContractFactory("RariPack");
  const TransparentProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");

  // ============================================
  // Deploy RariPack
  // ============================================
  console.log("--- Deploying RariPack ---\n");

  console.log("Deploying RariPack implementation...");
  const rariPackImpl = await RariPack.deploy({ nonce: nonce++ });
  console.log(`  Tx: ${rariPackImpl.deploymentTransaction()?.hash}`);
  await rariPackImpl.waitForDeployment();
  const rariPackImplAddr = await rariPackImpl.getAddress();
  console.log(`  ✓ Implementation: ${rariPackImplAddr}\n`);

  console.log("Deploying RariPack proxy...");
  const rariPackInitData = RariPack.interface.encodeFunctionData("initialize", [owner, treasury, packName, packSymbol]);
  const rariPackProxy = await TransparentProxy.deploy(rariPackImplAddr, owner, rariPackInitData, { nonce: nonce++ });
  console.log(`  Tx: ${rariPackProxy.deploymentTransaction()?.hash}`);
  await rariPackProxy.waitForDeployment();
  const rariPackProxyAddr = await rariPackProxy.getAddress();
  console.log(`  ✓ Proxy: ${rariPackProxyAddr}\n`);

  // Get contract instance at proxy address
  const rariPack = RariPack.attach(rariPackProxyAddr) as typeof rariPackImpl;

  // ============================================
  // Configure Pack Prices
  // ============================================
  console.log("--- Configuring Pack Prices ---\n");

  const prices = [
    { type: PackType.Bronze, name: "Bronze", price: config.prices.bronze },
    { type: PackType.Silver, name: "Silver", price: config.prices.silver },
    { type: PackType.Gold, name: "Gold", price: config.prices.gold },
    { type: PackType.Platinum, name: "Platinum", price: config.prices.platinum },
  ];

  for (const { type, name, price } of prices) {
    const priceWei = ethers.parseEther(String(price));
    console.log(`  ${name.padEnd(10)}: ${price} ETH`);
    const tx = await rariPack.setPackPrice(type, priceWei, { nonce: nonce++ });
    await tx.wait();
  }
  console.log("  ✓ Prices configured\n");

  // ============================================
  // Configure Pack URIs (if provided)
  // ============================================
  if (config.uris) {
    console.log("--- Configuring Pack URIs ---\n");

    const uris = [
      { type: PackType.Bronze, name: "Bronze", uri: config.uris.bronze },
      { type: PackType.Silver, name: "Silver", uri: config.uris.silver },
      { type: PackType.Gold, name: "Gold", uri: config.uris.gold },
      { type: PackType.Platinum, name: "Platinum", uri: config.uris.platinum },
    ];

    for (const { type, name, uri } of uris) {
      if (uri) {
        console.log(`  ${name.padEnd(10)}: ${uri.substring(0, 50)}...`);
        const tx = await rariPack.setPackURI(type, uri, { nonce: nonce++ });
        await tx.wait();
      }
    }
    console.log("  ✓ URIs configured\n");
  }

  // ============================================
  // Configure Pack Descriptions (if provided)
  // ============================================
  if (config.descriptions) {
    console.log("--- Configuring Pack Descriptions ---\n");

    const descriptions = [
      { type: PackType.Bronze, name: "Bronze", desc: config.descriptions.bronze },
      { type: PackType.Silver, name: "Silver", desc: config.descriptions.silver },
      { type: PackType.Gold, name: "Gold", desc: config.descriptions.gold },
      { type: PackType.Platinum, name: "Platinum", desc: config.descriptions.platinum },
    ];

    for (const { type, name, desc } of descriptions) {
      if (desc) {
        console.log(`  ${name.padEnd(10)}: ${desc.substring(0, 40)}...`);
        const tx = await rariPack.setPackDescription(type, desc, { nonce: nonce++ });
        await tx.wait();
      }
    }
    console.log("  ✓ Descriptions configured\n");
  }

  // ============================================
  // Save deployment output
  // ============================================
  const dateStr = getDateString();
  const deploymentsDir = path.join(projectRoot, "deployments", networkName, dateStr);

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputYaml: Record<string, any> = {
    network: networkName,
    chainId: networkConfig.chainId,
    deployedAt: new Date().toISOString(),
    contracts: {
      rariPack: rariPackProxyAddr,
    },
    implementations: {
      rariPack: rariPackImplAddr,
    },
    configuration: {
      owner,
      treasury,
      name: packName,
      symbol: packSymbol,
      prices: {
        bronze: String(config.prices.bronze),
        silver: String(config.prices.silver),
        gold: String(config.prices.gold),
        platinum: String(config.prices.platinum),
      },
    },
  };

  const outputPath = path.join(deploymentsDir, "raripack.yaml");
  fs.writeFileSync(outputPath, yaml.dump(outputYaml, { lineWidth: -1 }));

  // ============================================
  // Summary
  // ============================================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         RariPack Deployed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`RariPack Proxy:          ${rariPackProxyAddr}`);
  console.log(`RariPack Implementation: ${rariPackImplAddr}`);
  console.log(`\nOutput saved to: ${outputPath}`);

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Next Steps                                                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`
1. Copy the RariPack address to your infrastructure YAML:
   rariPack: "${rariPackProxyAddr}"

2. Deploy NftPool and PackManager:
   INFRA_CONFIG=config/infrastructure.${networkName}.yaml yarn deploy:nft-infra:${networkName}

3. After deploying PackManager, grant BURNER_ROLE:
   cast send ${rariPackProxyAddr} "grantRole(bytes32,address)" \\
     $(cast keccak "BURNER_ROLE") <PACK_MANAGER_ADDRESS> \\
     --private-key $PRIVATE_KEY --rpc-url $RPC_URL
`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
