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
// Network-specific VRF configuration
// IMPORTANT: These values are hardcoded per-network to avoid env var confusion
// Env vars (e.g., BASE_VRF_SUBSCRIPTION_ID) can override if needed
const NETWORK_CONFIG: Record<
  string,
  {
    chainId: string;
    owner: string;
    vrfCoordinator: string;
    vrfKeyHash: string;
    vrfSubIdEnvVar: string;
    vrfSubscriptionId: string;
    packMetadataBase: string;
  }
> = {
  base: {
    chainId: "8453",
    owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f",
    // Base Mainnet Chainlink VRF v2.5
    vrfCoordinator: "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",
    vrfKeyHash: "0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab",
    vrfSubIdEnvVar: "BASE_VRF_SUBSCRIPTION_ID",
    vrfSubscriptionId: "80015873168992726859849382095434323321462670158563823161174109925990052043078",
    packMetadataBase: "https://rarible-drops.s3.filebase.com/Base/pack",
  },
  sepolia: {
    chainId: "11155111",
    owner: "0xa95a09520af0f1bbef810a47560c79affe75aa9f",
    // Sepolia Testnet Chainlink VRF v2.5
    vrfCoordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    vrfKeyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    vrfSubIdEnvVar: "SEPOLIA_VRF_SUBSCRIPTION_ID",
    vrfSubscriptionId: "31234815417281375020060825130305937433281857209550563487914138707724720747173",
    packMetadataBase: "https://rarible-drops.s3.filebase.com/Base/pack",
  },
};

// Role constants - get from contract to ensure correctness
// BURNER_ROLE = keccak256("BURNER_ROLE") = 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
// POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE") = 0x6077685936c8169d09204a1d97db12e41713588c38e1d29a61867d3dcee98aff

// Pack types
const PackType = { Bronze: 0, Silver: 1, Gold: 2, Platinum: 3 };

/**
 * Step 2: Deploy Pack Infrastructure (RariPack, NftPool, PackManager).
 * Uses direct ethers deployment with manual nonce management.
 *
 * Usage:
 *   yarn step2:base
 *   yarn step2:sepolia
 */
async function main() {
  const { ethers, networkName } = await network.connect() as any;

  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Use 'base' or 'sepolia'.`);
  }

  const [signer] = await ethers.getSigners();
  const owner = process.env.PACK_OWNER ?? config.owner;
  const treasury = process.env.PACK_TREASURY ?? owner;

  // VRF Configuration - prefer hardcoded config for safety, env vars only for override
  // Network-specific env vars (e.g., BASE_VRF_*) override config, generic VRF_* is last resort
  const vrfCoordinator = process.env[`${networkName.toUpperCase()}_VRF_COORDINATOR`] ?? config.vrfCoordinator;
  const vrfKeyHash = process.env[`${networkName.toUpperCase()}_VRF_KEY_HASH`] ?? config.vrfKeyHash;
  const vrfSubscriptionId = process.env[config.vrfSubIdEnvVar] ?? config.vrfSubscriptionId ?? process.env.VRF_SUBSCRIPTION_ID;

  if (!vrfSubscriptionId) {
    throw new Error(`Set ${config.vrfSubIdEnvVar} or VRF_SUBSCRIPTION_ID in .env, or add vrfSubscriptionId to config`);
  }

  // Pack metadata URIs
  const bronzeUri = process.env.PACK_URI_BRONZE ?? `${config.packMetadataBase}/bronze.json`;
  const silverUri = process.env.PACK_URI_SILVER ?? `${config.packMetadataBase}/silver.json`;
  const goldUri = process.env.PACK_URI_GOLD ?? `${config.packMetadataBase}/gold.json`;
  const platinumUri = process.env.PACK_URI_PLATINUM ?? `${config.packMetadataBase}/platinum.json`;

  // Custom pool ranges for TEST MODE (1-5 cents at ETH=$3300)
  const customPoolRanges = [
    { lowPrice: BigInt("0"), highPrice: BigInt("4500000000000") },
    { lowPrice: BigInt("4500000000000"), highPrice: BigInt("7500000000000") },
    { lowPrice: BigInt("7500000000000"), highPrice: BigInt("10500000000000") },
    { lowPrice: BigInt("10500000000000"), highPrice: BigInt("13500000000000") },
    { lowPrice: BigInt("13500000000000"), highPrice: BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935") },
  ];

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║         STEP 2: Deploy Pack Infrastructure (${networkName.toUpperCase().padEnd(7)})       ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:  ${networkName} (chainId: ${config.chainId})`);
  console.log(`Signer:   ${signer.address}`);
  console.log(`Owner:    ${owner}`);
  console.log(`Treasury: ${treasury}`);
  console.log(`\nVRF Config:`);
  console.log(`  Coordinator:    ${vrfCoordinator}`);
  console.log(`  Subscription:   ${vrfSubscriptionId}`);
  console.log(`  Key Hash:       ${vrfKeyHash}`);
  console.log("\n⚠️  TEST MODE: Using custom low pool ranges (1-5 cents at ETH=$3300)\n");

  // Get current nonce
  let nonce = await signer.getNonce();
  console.log(`Starting nonce: ${nonce}\n`);

  // Get contract factories
  const RariPack = await ethers.getContractFactory("RariPack");
  const NftPool = await ethers.getContractFactory("NftPool");
  const PackManager = await ethers.getContractFactory("PackManager");
  const TransparentProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");

  // ============================================
  // 1. Deploy RariPack
  // ============================================
  console.log("--- Deploying RariPack ---\n");

  console.log("Deploying RariPack implementation...");
  const rariPackImpl = await RariPack.deploy({ nonce: nonce++ });
  console.log(`  Tx: ${rariPackImpl.deploymentTransaction()?.hash}`);
  await rariPackImpl.waitForDeployment();
  const rariPackImplAddr = await rariPackImpl.getAddress();
  console.log(`  ✓ Implementation: ${rariPackImplAddr}\n`);

  console.log("Deploying RariPack proxy...");
  const rariPackInitData = RariPack.interface.encodeFunctionData("initialize", [owner, treasury, "Rari Pack", "RPACK"]);
  const rariPackProxy = await TransparentProxy.deploy(rariPackImplAddr, owner, rariPackInitData, { nonce: nonce++ });
  console.log(`  Tx: ${rariPackProxy.deploymentTransaction()?.hash}`);
  await rariPackProxy.waitForDeployment();
  const rariPackProxyAddr = await rariPackProxy.getAddress();
  console.log(`  ✓ Proxy: ${rariPackProxyAddr}\n`);

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
  const nftPoolInitData = NftPool.interface.encodeFunctionData("initialize", [owner, customPoolRanges]);
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
  const packManagerInitData = PackManager.interface.encodeFunctionData("initialize", [owner, rariPackProxyAddr]);
  const packManagerProxy = await TransparentProxy.deploy(packManagerImplAddr, owner, packManagerInitData, { nonce: nonce++ });
  console.log(`  Tx: ${packManagerProxy.deploymentTransaction()?.hash}`);
  await packManagerProxy.waitForDeployment();
  const packManagerProxyAddr = await packManagerProxy.getAddress();
  console.log(`  ✓ Proxy: ${packManagerProxyAddr}\n`);

  // ============================================
  // 4. Setup: Grant roles and configure
  // ============================================
  console.log("--- Configuring Contracts ---\n");

  // Get contract instances at proxy addresses
  const rariPack = RariPack.attach(rariPackProxyAddr) as typeof rariPackImpl;
  const nftPool = NftPool.attach(nftPoolProxyAddr) as typeof nftPoolImpl;
  const packManager = PackManager.attach(packManagerProxyAddr) as typeof packManagerImpl;

  // Get actual role hashes from contracts to ensure correctness
  const BURNER_ROLE = await rariPack.BURNER_ROLE();
  const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
  console.log(`Role hashes:`);
  console.log(`  BURNER_ROLE: ${BURNER_ROLE}`);
  console.log(`  POOL_MANAGER_ROLE: ${POOL_MANAGER_ROLE}\n`);

  // Grant BURNER_ROLE to PackManager on RariPack
  console.log("Granting BURNER_ROLE to PackManager on RariPack...");
  let tx = await rariPack.grantRole(BURNER_ROLE, packManagerProxyAddr, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Grant POOL_MANAGER_ROLE to PackManager on NftPool
  console.log("Granting POOL_MANAGER_ROLE to PackManager on NftPool...");
  tx = await nftPool.grantRole(POOL_MANAGER_ROLE, packManagerProxyAddr, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Set NftPool in PackManager
  console.log("Setting NftPool in PackManager...");
  tx = await packManager.setNftPool(nftPoolProxyAddr, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Configure VRF
  console.log("Configuring VRF...");
  tx = await packManager.setVrfConfig(vrfCoordinator, vrfSubscriptionId, vrfKeyHash, 500000, 3, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Set RariPack treasury to PackManager (pack sales ETH flows to PackManager for instant cash payouts)
  console.log("Setting RariPack treasury to PackManager...");
  tx = await rariPack.setTreasury(packManagerProxyAddr, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Enable instant cash by default
  console.log("Enabling instant cash...");
  tx = await packManager.setInstantCashEnabled(true, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Set payout treasury (receives excess ETH above threshold)
  console.log("Setting payout treasury to owner...");
  tx = await packManager.setPayoutTreasury(config.owner, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Set treasury threshold (5 ETH - excess above this is forwarded to payoutTreasury)
  console.log("Setting treasury threshold to 5 ETH...");
  const FIVE_ETH = BigInt("5000000000000000000"); // 5 * 10^18
  tx = await packManager.setTreasuryThreshold(FIVE_ETH, { nonce: nonce++ });
  await tx.wait();
  console.log(`  ✓ Done (tx: ${tx.hash})\n`);

  // Set pack prices (TEST MODE - very low)
  console.log("Setting pack prices...");
  const prices = [
    { type: PackType.Bronze, price: BigInt("1000000000000") },
    { type: PackType.Silver, price: BigInt("2000000000000") },
    { type: PackType.Gold, price: BigInt("3000000000000") },
    { type: PackType.Platinum, price: BigInt("5000000000000") },
  ];
  for (const { type, price } of prices) {
    tx = await rariPack.setPackPrice(type, price, { nonce: nonce++ });
    await tx.wait();
  }
  console.log(`  ✓ Done\n`);

  // Set pack URIs
  console.log("Setting pack URIs...");
  const uris = [
    { type: PackType.Bronze, uri: bronzeUri },
    { type: PackType.Silver, uri: silverUri },
    { type: PackType.Gold, uri: goldUri },
    { type: PackType.Platinum, uri: platinumUri },
  ];
  for (const { type, uri } of uris) {
    tx = await rariPack.setPackURI(type, uri, { nonce: nonce++ });
    await tx.wait();
  }
  console.log(`  ✓ Done\n`);

  // Set pack descriptions
  console.log("Setting pack descriptions...");
  const descriptions = [
    { type: PackType.Bronze, desc: "Bronze pack for entry-level pulls from the common pool." },
    { type: PackType.Silver, desc: "Silver pack with better chances into the rare pool." },
    { type: PackType.Gold, desc: "Gold pack offering improved odds across rare and epic pools." },
    { type: PackType.Platinum, desc: "Platinum pack with the best odds and access to the ultra-rare pool." },
  ];
  for (const { type, desc } of descriptions) {
    tx = await rariPack.setPackDescription(type, desc, { nonce: nonce++ });
    await tx.wait();
  }
  console.log(`  ✓ Done\n`);

  // ============================================
  // Save deployed addresses
  // ============================================
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const deploymentsDir = path.join(projectRoot, "ignition", "deployments", `chain-${config.chainId}`);

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const infraAddresses = {
    rariPack: rariPackProxyAddr,
    packManager: packManagerProxyAddr,
    nftPool: nftPoolProxyAddr,
    implementations: {
      rariPack: rariPackImplAddr,
      nftPool: nftPoolImplAddr,
      packManager: packManagerImplAddr,
    },
  };

  const infraPath = path.join(deploymentsDir, "infrastructure.json");
  fs.writeFileSync(infraPath, JSON.stringify(infraAddresses, null, 2));

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         Infrastructure Deployed                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`RariPack:    ${rariPackProxyAddr}`);
  console.log(`NftPool:     ${nftPoolProxyAddr}`);
  console.log(`PackManager: ${packManagerProxyAddr}`);
  console.log(`\nSaved to: ${infraPath}`);

  // ============================================
  // Verify role assignments
  // ============================================
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         Role Verification                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const hasBurnerRole = await rariPack.hasRole(BURNER_ROLE, packManagerProxyAddr);
  const hasPoolManagerRole = await nftPool.hasRole(POOL_MANAGER_ROLE, packManagerProxyAddr);
  const instantCashEnabled = await packManager.instantCashEnabled();
  const rariPackTreasury = await rariPack.treasury();
  const treasuryIsPackManager = rariPackTreasury.toLowerCase() === packManagerProxyAddr.toLowerCase();
  const payoutTreasury = await packManager.payoutTreasury();
  const treasuryThreshold = await packManager.treasuryThreshold();

  console.log(`PackManager has BURNER_ROLE on RariPack:       ${hasBurnerRole ? "✅" : "❌"}`);
  console.log(`PackManager has POOL_MANAGER_ROLE on NftPool:  ${hasPoolManagerRole ? "✅" : "❌"}`);
  console.log(`PackManager instantCashEnabled:               ${instantCashEnabled ? "✅" : "❌"}`);
  console.log(`RariPack treasury is PackManager:             ${treasuryIsPackManager ? "✅" : "❌"}`);
  console.log(`PackManager payoutTreasury:                   ${payoutTreasury}`);
  console.log(`PackManager treasuryThreshold:                ${Number(treasuryThreshold) / 1e18} ETH`);

  if (!hasBurnerRole || !hasPoolManagerRole || !instantCashEnabled || !treasuryIsPackManager) {
    throw new Error("❌ Verification failed! Check roles and settings above.");
  }
  console.log("\n✅ All roles and settings verified successfully!");

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  ⚠️  IMPORTANT: Add PackManager to VRF Subscription!       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nGo to https://vrf.chain.link/ and add this address as a consumer:`);
  console.log(`  ${packManagerProxyAddr}\n`);

  console.log(`✅ Step 2 complete! Run 'yarn step3:${networkName}' next.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
