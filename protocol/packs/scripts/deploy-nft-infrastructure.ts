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

// ============================================
// Type definitions for YAML configuration
// ============================================

interface PoolRange {
  level: string;
  lowPriceEth: number;
  highPriceEth: number | string;
}

interface VrfConfig {
  coordinator: string;
  subscriptionId: string;
  keyHash: string;
  callbackGasLimit: number;
  requestConfirmations: number;
}

interface PackProbabilities {
  ultraRare: number;
  legendary: number;
  epic: number;
  rare: number;
}

interface PackManagerConfig {
  instantCashEnabled?: boolean;
  treasuryThresholdEth?: number;
  payoutTreasury?: string;
  vrf: VrfConfig;
  probabilities?: {
    bronze?: PackProbabilities;
    silver?: PackProbabilities;
    gold?: PackProbabilities;
    platinum?: PackProbabilities;
  };
}

interface RariPackConfig {
  address?: string;
  deploy?: boolean;
  treasury?: string;
  name?: string;
  symbol?: string;
}

interface InfrastructureConfig {
  network?: string;
  chainId?: string;
  owner: string;
  rariPack: string | RariPackConfig;
  poolRanges: PoolRange[];
  packManager: PackManagerConfig;
}

/**
 * Deploy NFT infrastructure: NftPool and PackManager.
 * Reads all settings from a YAML configuration file.
 *
 * This script deploys:
 *   - NftPool (implementation + proxy)
 *   - PackManager (implementation + proxy)
 *
 * And configures:
 *   - Pool price ranges
 *   - VRF settings
 *   - Pack probabilities
 *   - Instant cash settings
 *
 * Usage:
 *   INFRA_CONFIG=config/infrastructure.base.yaml yarn deploy:nft-infra:base
 *   INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia
 */
async function main() {
  const { ethers, networkName } = (await network.connect()) as any;

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();

  // Get YAML file path from environment variable
  let yamlPath = process.env.INFRA_CONFIG;

  if (!yamlPath) {
    console.error("Usage: INFRA_CONFIG=<yaml-path> yarn deploy:nft-infra:<network>");
    console.error("Example: INFRA_CONFIG=config/infrastructure.sepolia.yaml yarn deploy:nft-infra:sepolia");
    process.exit(1);
  }

  // Resolve relative paths
  if (!path.isAbsolute(yamlPath)) {
    yamlPath = path.resolve(process.cwd(), yamlPath);
  }

  if (!fs.existsSync(yamlPath)) {
    throw new Error(`YAML file not found: ${yamlPath}`);
  }

  // Parse YAML
  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const infraConfig = yaml.load(yamlContent) as InfrastructureConfig;

  // Validate required fields
  if (!infraConfig.owner) {
    throw new Error("Missing 'owner' in YAML config");
  }
  if (!infraConfig.poolRanges || infraConfig.poolRanges.length !== 5) {
    throw new Error("Missing or invalid 'poolRanges' in YAML config (need exactly 5 levels)");
  }
  if (!infraConfig.packManager?.vrf) {
    throw new Error("Missing 'packManager.vrf' in YAML config");
  }

  const owner = infraConfig.owner;
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const vrfConfig = infraConfig.packManager.vrf;

  // Parse pool ranges
  const poolRanges = infraConfig.poolRanges.map((r) => {
    const lowPrice = ethers.parseEther(String(r.lowPriceEth));
    const highPrice =
      r.highPriceEth === "infinity"
        ? BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")
        : ethers.parseEther(String(r.highPriceEth));
    return { lowPrice, highPrice };
  });

  // Create output directory with current date
  const dateStr = getDateString();
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const deploymentsBaseDir = path.join(projectRoot, "deployments");
  const deploymentDir = path.join(deploymentsBaseDir, networkName, dateStr);

  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // ============================================
  // Auto-discover RariPack from previous step
  // ============================================
  // Priority:
  // 1. RARIPACK_DEPLOY env var (path to raripack.yaml from deploy-raripack.ts)
  // 2. raripack.yaml in today's deployment folder
  // 3. rariPack address in infrastructure config
  // 4. Deploy new RariPack if deploy: true or address missing
  
  let rariPackFromDeployment: string | undefined;
  let rariPackSource = "config";
  
  // Check RARIPACK_DEPLOY env var first
  const rariPackDeployPath = process.env.RARIPACK_DEPLOY;
  if (rariPackDeployPath) {
    const fullPath = path.isAbsolute(rariPackDeployPath) ? rariPackDeployPath : path.resolve(process.cwd(), rariPackDeployPath);
    if (fs.existsSync(fullPath)) {
      const rariPackYaml = yaml.load(fs.readFileSync(fullPath, "utf-8")) as any;
      if (rariPackYaml?.contracts?.rariPack) {
        rariPackFromDeployment = rariPackYaml.contracts.rariPack;
        rariPackSource = `RARIPACK_DEPLOY (${fullPath})`;
      }
    }
  }
  
  // Check for raripack.yaml in today's deployment folder
  if (!rariPackFromDeployment) {
    const rariPackYamlPath = path.join(deploymentDir, "raripack.yaml");
    if (fs.existsSync(rariPackYamlPath)) {
      const rariPackYaml = yaml.load(fs.readFileSync(rariPackYamlPath, "utf-8")) as any;
      if (rariPackYaml?.contracts?.rariPack) {
        rariPackFromDeployment = rariPackYaml.contracts.rariPack;
        rariPackSource = `auto-discovered (${rariPackYamlPath})`;
      }
    }
  }

  const rawRariPack = infraConfig.rariPack;
  const rariPackConfig: RariPackConfig = typeof rawRariPack === "string" 
    ? { address: rawRariPack } 
    : (rawRariPack ?? {});
  
  // Use discovered address if available, otherwise fall back to config
  let rariPackAddress = rariPackFromDeployment ?? rariPackConfig.address;
  const deployRariPack = rariPackConfig.deploy === true || !rariPackAddress || rariPackAddress === zeroAddress;
  
  if (!deployRariPack && (!rariPackAddress || rariPackAddress === zeroAddress)) {
    throw new Error("No RariPack address found. Either:\n" +
      "  1. Run deploy:raripack first, or\n" +
      "  2. Set RARIPACK_DEPLOY env var pointing to raripack.yaml, or\n" +
      "  3. Add rariPack address to infrastructure config, or\n" +
      "  4. Set rariPack.deploy: true in config to deploy a new one");
  }

  const rariPackTreasury = rariPackConfig.treasury ?? owner;
  const rariPackName = rariPackConfig.name ?? "Rari Pack";
  const rariPackSymbol = rariPackConfig.symbol ?? "RPACK";

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║     DEPLOY NFT INFRASTRUCTURE (${networkName.toUpperCase().padEnd(7)})                  ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:          ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:           ${signer.address}`);
  console.log(`Config file:      ${yamlPath}`);
  console.log(`Owner:            ${owner}`);
  console.log(`RariPack:         ${deployRariPack ? "will deploy new" : rariPackAddress}`);
  if (!deployRariPack) {
    console.log(`  Source:         ${rariPackSource}`);
  }
  if (deployRariPack) {
    console.log(`  Treasury:       ${rariPackTreasury}`);
    console.log(`  Name/Symbol:    ${rariPackName} / ${rariPackSymbol}`);
  }
  console.log(`Output Directory: ${deploymentDir}`);

  console.log(`\nVRF Config:`);
  console.log(`  Coordinator:    ${vrfConfig.coordinator}`);
  console.log(`  Subscription:   ${vrfConfig.subscriptionId}`);
  console.log(`  Key Hash:       ${vrfConfig.keyHash}`);
  console.log(`  Callback Gas:   ${vrfConfig.callbackGasLimit}`);
  console.log(`  Confirmations:  ${vrfConfig.requestConfirmations}`);

  console.log("\nPool Ranges:");
  for (let i = 0; i < poolRanges.length; i++) {
    const lowEth = Number(poolRanges[i].lowPrice) / 1e18;
    const highEth =
      poolRanges[i].highPrice.toString() === "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        ? "∞"
        : (Number(poolRanges[i].highPrice) / 1e18).toFixed(5);
    console.log(`  ${POOL_LEVEL_NAMES[i].padEnd(10)}: ${lowEth.toFixed(5)} - ${highEth} ETH`);
  }

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`\nStarting nonce: ${nonce}\n`);

  // Get contract factories
  const RariPack = await ethers.getContractFactory("RariPack");
  const NftPool = await ethers.getContractFactory("NftPool");
  const PackManager = await ethers.getContractFactory("PackManager");
  const TransparentProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");

  // ============================================
  // 1. Deploy (or attach) RariPack
  // ============================================
  let rariPackImplAddr: string | undefined;
  if (deployRariPack) {
    console.log("--- Deploying RariPack ---\n");

    console.log("Deploying RariPack implementation...");
    const rariPackImpl = await RariPack.deploy({ nonce: nonce++ });
    console.log(`  Tx: ${rariPackImpl.deploymentTransaction()?.hash}`);
    await rariPackImpl.waitForDeployment();
    rariPackImplAddr = await rariPackImpl.getAddress();
    console.log(`  ✓ Implementation: ${rariPackImplAddr}\n`);

    console.log("Deploying RariPack proxy...");
    const rariPackInitData = RariPack.interface.encodeFunctionData("initialize", [
      owner,
      rariPackTreasury,
      rariPackName,
      rariPackSymbol,
    ]);
    const rariPackProxy = await TransparentProxy.deploy(rariPackImplAddr, owner, rariPackInitData, { nonce: nonce++ });
    console.log(`  Tx: ${rariPackProxy.deploymentTransaction()?.hash}`);
    await rariPackProxy.waitForDeployment();
    rariPackAddress = await rariPackProxy.getAddress();
    console.log(`  ✓ Proxy: ${rariPackAddress}\n`);
  } else {
    console.log("--- Using Existing RariPack ---\n");
    console.log(`RariPack: ${rariPackAddress}\n`);
  }

  if (!rariPackAddress) {
    throw new Error("RariPack address is not set after deployment/attachment");
  }

  // ============================================
  // 2. Deploy NftPool
  // ============================================
  console.log("--- Deploying NftPool ---\n");

  console.log("Deploying NftPool implementation...");
  const nftPoolImpl = await NftPool.deploy({ nonce: nonce++ });
  console.log(`  Tx: ${nftPoolImpl.deploymentTransaction()?.hash}`);
  await nftPoolImpl.waitForDeployment();
  const nftPoolImplAddr = await nftPoolImpl.getAddress();
  console.log(`  ✓ Implementation: ${nftPoolImplAddr}\n`);

  console.log("Deploying NftPool proxy...");
  const nftPoolInitData = NftPool.interface.encodeFunctionData("initialize", [owner, poolRanges]);
  const nftPoolProxy = await TransparentProxy.deploy(nftPoolImplAddr, owner, nftPoolInitData, { nonce: nonce++ });
  console.log(`  Tx: ${nftPoolProxy.deploymentTransaction()?.hash}`);
  await nftPoolProxy.waitForDeployment();
  const nftPoolProxyAddr = await nftPoolProxy.getAddress();
  console.log(`  ✓ Proxy: ${nftPoolProxyAddr}\n`);

  // ============================================
  // 3. Deploy PackManager
  // ============================================
  console.log("--- Deploying PackManager ---\n");

  console.log("Deploying PackManager implementation...");
  const packManagerImpl = await PackManager.deploy({ nonce: nonce++ });
  console.log(`  Tx: ${packManagerImpl.deploymentTransaction()?.hash}`);
  await packManagerImpl.waitForDeployment();
  const packManagerImplAddr = await packManagerImpl.getAddress();
  console.log(`  ✓ Implementation: ${packManagerImplAddr}\n`);

  console.log("Deploying PackManager proxy...");
  const packManagerInitData = PackManager.interface.encodeFunctionData("initialize", [owner, rariPackAddress]);
  const packManagerProxy = await TransparentProxy.deploy(packManagerImplAddr, owner, packManagerInitData, {
    nonce: nonce++,
  });
  console.log(`  Tx: ${packManagerProxy.deploymentTransaction()?.hash}`);
  await packManagerProxy.waitForDeployment();
  const packManagerProxyAddr = await packManagerProxy.getAddress();
  console.log(`  ✓ Proxy: ${packManagerProxyAddr}\n`);

  // ============================================
  // 4. Configure contracts
  // ============================================
  console.log("--- Configuring Contracts ---\n");

  // Get contract instances at proxy addresses
  const rariPack = RariPack.attach(rariPackAddress);
  const nftPool = NftPool.attach(nftPoolProxyAddr) as typeof nftPoolImpl;
  const packManager = PackManager.attach(packManagerProxyAddr) as typeof packManagerImpl;

  // Get role hashes
  const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
  console.log(`POOL_MANAGER_ROLE: ${POOL_MANAGER_ROLE}\n`);

  // Grant BURNER_ROLE to PackManager on RariPack when RariPack was deployed here
  if (deployRariPack) {
    const BURNER_ROLE = await rariPack.BURNER_ROLE();
    console.log(`BURNER_ROLE: ${BURNER_ROLE}\n`);
    console.log("Granting BURNER_ROLE to PackManager on RariPack...");
    let tx = await rariPack.grantRole(BURNER_ROLE, packManagerProxyAddr, { nonce: nonce++ });
    await tx.wait();
    console.log(`  ✓ Done (tx: ${tx.hash})\n`);
  }

  // Grant POOL_MANAGER_ROLE to PackManager on NftPool
  console.log("Granting POOL_MANAGER_ROLE to PackManager on NftPool...");
  let tx = await nftPool.grantRole(POOL_MANAGER_ROLE, packManagerProxyAddr, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Set NftPool in PackManager
  console.log("Setting NftPool in PackManager...");
  tx = await packManager.setNftPool(nftPoolProxyAddr, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Configure VRF
  console.log("Configuring VRF...");
  tx = await packManager.setVrfConfig(
    vrfConfig.coordinator,
    vrfConfig.subscriptionId,
    vrfConfig.keyHash,
    vrfConfig.callbackGasLimit,
    vrfConfig.requestConfirmations,
    { nonce: nonce++ }
  );
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Configure PackManager settings from YAML
  const pmConfig = infraConfig.packManager;

  // Payout Treasury
  if (pmConfig.payoutTreasury && pmConfig.payoutTreasury !== "0x0000000000000000000000000000000000000000") {
    console.log(`Setting payout treasury: ${pmConfig.payoutTreasury}...`);
    tx = await packManager.setPayoutTreasury(pmConfig.payoutTreasury, { nonce: nonce++ });
    await tx.wait();
    console.log(`  ✓ Done (tx: ${tx.hash})\n`);
  }

  // Treasury Threshold
  if (pmConfig.treasuryThresholdEth !== undefined) {
    const threshold = ethers.parseEther(String(pmConfig.treasuryThresholdEth));
    console.log(`Setting treasury threshold: ${pmConfig.treasuryThresholdEth} ETH...`);
    tx = await packManager.setTreasuryThreshold(threshold, { nonce: nonce++ });
    await tx.wait();
    console.log(`  ✓ Done (tx: ${tx.hash})\n`);
  }

  // Instant Cash
  if (pmConfig.instantCashEnabled !== undefined) {
    console.log(`Setting instant cash enabled: ${pmConfig.instantCashEnabled}...`);
    tx = await packManager.setInstantCashEnabled(pmConfig.instantCashEnabled, { nonce: nonce++ });
    await tx.wait();
    console.log(`  ✓ Done (tx: ${tx.hash})\n`);
  }

  // Pack Probabilities
  if (pmConfig.probabilities) {
    console.log("Setting pack probabilities...");
    const packTypes = ["bronze", "silver", "gold", "platinum"];
    const packTypeEnums = [0, 1, 2, 3];

    for (let i = 0; i < packTypes.length; i++) {
      const probs = pmConfig.probabilities[packTypes[i] as keyof typeof pmConfig.probabilities];
      if (probs) {
        console.log(
          `  ${packTypes[i].charAt(0).toUpperCase() + packTypes[i].slice(1)}: ` +
            `ultraRare=${probs.ultraRare}, legendary=${probs.legendary}, epic=${probs.epic}, rare=${probs.rare}`
        );
        tx = await packManager.setPackProbabilities(
          packTypeEnums[i],
          probs.ultraRare,
          probs.legendary,
          probs.epic,
          probs.rare,
          { nonce: nonce++ }
        );
        await tx.wait();
      }
    }
    console.log(`  ✓ Pack probabilities set\n`);
  }

  // ============================================
  // Save deployment results
  // ============================================
  const timestamp = new Date().toISOString();

  const deploymentResult = {
    timestamp,
    date: dateStr,
    network: networkName,
    chainId: config.chainId,
    configFile: yamlPath,
    deployer: signer.address,
    owner,
    contracts: {
      nftPool: {
        proxy: nftPoolProxyAddr,
        implementation: nftPoolImplAddr,
      },
      packManager: {
        proxy: packManagerProxyAddr,
        implementation: packManagerImplAddr,
      },
      rariPack: rariPackAddress,
    },
    vrfConfig: {
      coordinator: vrfConfig.coordinator,
      subscriptionId: vrfConfig.subscriptionId,
      keyHash: vrfConfig.keyHash,
      callbackGasLimit: vrfConfig.callbackGasLimit,
      requestConfirmations: vrfConfig.requestConfirmations,
    },
    poolRanges: poolRanges.map((r, i) => ({
      level: POOL_LEVEL_NAMES[i],
      lowPrice: r.lowPrice.toString(),
      highPrice: r.highPrice.toString(),
      lowPriceEth: Number(r.lowPrice) / 1e18,
      highPriceEth:
        r.highPrice === BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")
          ? "infinity"
          : Number(r.highPrice) / 1e18,
    })),
  };

  // Save to date-stamped folder
  const resultPath = path.join(deploymentDir, "nft-infrastructure.json");
  fs.writeFileSync(resultPath, JSON.stringify(deploymentResult, null, 2));

  // Save YAML output with deployed addresses
  const outputYamlData = {
    network: networkName,
    chainId: config.chainId,
    deployedAt: timestamp,
    owner,
    contracts: {
      nftPool: nftPoolProxyAddr,
      packManager: packManagerProxyAddr,
      rariPack: rariPackAddress,
    },
    implementations: {
      nftPool: nftPoolImplAddr,
      packManager: packManagerImplAddr,
      ...(rariPackImplAddr ? { rariPack: rariPackImplAddr } : {}),
    },
  };

  const outputYamlPath = path.join(deploymentDir, "infrastructure.yaml");
  const outputYamlContent = `# NFT Pack System - Deployed Infrastructure
# =========================================
# Deployed: ${timestamp}
# Network: ${networkName} (chainId: ${config.chainId})

${yaml.dump(outputYamlData, { lineWidth: 120, noRefs: true, sortKeys: false })}`;
  fs.writeFileSync(outputYamlPath, outputYamlContent);

  // Also update the ignition deployments infrastructure.json for compatibility
  const ignitionDeploymentsDir = path.join(projectRoot, "ignition", "deployments", `chain-${config.chainId}`);
  if (!fs.existsSync(ignitionDeploymentsDir)) {
    fs.mkdirSync(ignitionDeploymentsDir, { recursive: true });
  }

  const infraAddresses = {
    rariPack: rariPackAddress,
    packManager: packManagerProxyAddr,
    nftPool: nftPoolProxyAddr,
    implementations: {
      nftPool: nftPoolImplAddr,
      packManager: packManagerImplAddr,
      ...(rariPackImplAddr ? { rariPack: rariPackImplAddr } : {}),
    },
    deployedAt: timestamp,
    deploymentDir,
  };

  const ignitionInfraPath = path.join(ignitionDeploymentsDir, "infrastructure.json");
  fs.writeFileSync(ignitionInfraPath, JSON.stringify(infraAddresses, null, 2));

  // ============================================
  // Summary
  // ============================================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         NFT Infrastructure Deployed                        ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`NftPool:     ${nftPoolProxyAddr}`);
  console.log(`PackManager: ${packManagerProxyAddr}`);
  console.log(`RariPack:    ${rariPackAddress}`);

  console.log(`\nDeployment saved to:`);
  console.log(`  ${resultPath}`);
  console.log(`  ${outputYamlPath}`);
  console.log(`  ${ignitionInfraPath}`);

  // Verify configuration
  console.log("\n--- Verification ---\n");

  const hasPoolManagerRole = await nftPool.hasRole(POOL_MANAGER_ROLE, packManagerProxyAddr);
  const nftPoolInManager = await packManager.getNftPool();

  console.log(`PackManager has POOL_MANAGER_ROLE: ${hasPoolManagerRole ? "✅" : "❌"}`);
  console.log(`PackManager.nftPool set correctly: ${nftPoolInManager.toLowerCase() === nftPoolProxyAddr.toLowerCase() ? "✅" : "❌"}`);

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  ⚠️  IMPORTANT: Additional Setup Required                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  const burnerStep = deployRariPack
    ? "2. BURNER_ROLE already granted to PackManager (RariPack deployed here)."
    : `2. Grant BURNER_ROLE to PackManager on RariPack:\n   rariPack.grantRole(BURNER_ROLE, \"${packManagerProxyAddr}\")`;
  console.log(`
1. Add PackManager to VRF Subscription:
   Go to https://vrf.chain.link/ and add this consumer:
   ${packManagerProxyAddr}

${burnerStep}
`);

  console.log(`✅ Deployment complete!\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
