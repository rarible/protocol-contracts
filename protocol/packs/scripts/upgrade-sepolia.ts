/// @ai_context
/// Upgrade script that detects implementation changes and upgrades proxies
///
/// This script:
/// 1. Compiles contracts to get latest bytecode
/// 2. Compares deployed implementation bytecode with compiled bytecode
/// 3. If different, deploys new implementation and upgrades the proxy
///
/// Env:
/// - HARDHAT_NETWORK=sepolia (or use --network sepolia)
/// - FORCE_UPGRADE (optional): "true" to upgrade even if bytecode matches
/// - UPGRADE_RARIPACK (optional): "true" to only upgrade RariPack
/// - UPGRADE_NFTPOOL (optional): "true" to only upgrade NftPool
/// - UPGRADE_PACKMANAGER (optional): "true" to only upgrade PackManager
/// - DRY_RUN (optional): "true" to only check for changes without upgrading

import { network } from "hardhat";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { keccak256 } from "ethers";

// ERC1967 storage slots (from OpenZeppelin ERC1967Utils)
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

type DeployedAddresses = Record<string, string>;

interface ContractInfo {
  name: string;
  proxyKey: string;
  implKey: string;
  artifactPath: string;
}

const CONTRACTS: ContractInfo[] = [
  {
    name: "RariPack",
    proxyKey: "PackInfrastructureModule#RariPackProxy",
    implKey: "PackInfrastructureModule#RariPackImplementation",
    artifactPath: "artifacts/contracts/RariPack.sol/RariPack.json",
  },
  {
    name: "NftPool",
    proxyKey: "PackInfrastructureModule#NftPoolProxy",
    implKey: "PackInfrastructureModule#NftPoolImplementation",
    artifactPath: "artifacts/contracts/NftPool.sol/NftPool.json",
  },
  {
    name: "PackManager",
    proxyKey: "PackInfrastructureModule#PackManagerProxy",
    implKey: "PackInfrastructureModule#PackManagerImplementation",
    artifactPath: "artifacts/contracts/PackManager.sol/PackManager.json",
  },
];

function boolEnv(name: string, defaultValue = false): boolean {
  const v = (process.env[name] ?? "").trim().toLowerCase();
  if (!v) return defaultValue;
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Normalize bytecode by removing metadata hash suffix
 * Solidity appends a CBOR-encoded metadata hash that changes with source paths
 * See: https://docs.soliditylang.org/en/latest/metadata.html
 */
function normalizeBytecode(bytecode: string): string {
  // Remove 0x prefix if present
  const code = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  
  // Metadata is at the end: last 2 bytes encode length, then that many bytes of metadata
  // Format: ...code...a264....0033 (0x33 = 51 bytes of metadata + 2 length bytes)
  // We look for the CBOR marker 'a264' or 'a265' which indicates metadata start
  const metadataMarkers = ["a264", "a265"];
  
  for (const marker of metadataMarkers) {
    const idx = code.lastIndexOf(marker);
    if (idx > 0 && idx > code.length - 200) { // Metadata is typically < 100 bytes
      return "0x" + code.slice(0, idx);
    }
  }
  
  // If no metadata marker found, return original
  return "0x" + code;
}

async function main() {
  const connection = await network.connect();
  const networkName = connection.networkName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethers = (connection as any).ethers;

  if (networkName !== "sepolia") {
    throw new Error(`Use --network sepolia (current: ${networkName})`);
  }

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`\n🔧 Upgrade script running on ${networkName}`);
  console.log(`   Signer: ${signerAddress}\n`);

  // Paths
  const projectRoot = path.resolve(__dirname, "..");
  const deploymentsDir = path.join(projectRoot, "ignition", "deployments", "chain-11155111");
  const deployedAddressesPath = path.join(deploymentsDir, "deployed_addresses.json");
  const paramsDir = path.join(projectRoot, "ignition", "parameters");

  // Check if deployment exists
  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error(`No deployment found at ${deployedAddressesPath}. Run deploy first.`);
  }

  const deployedAddresses: DeployedAddresses = JSON.parse(
    fs.readFileSync(deployedAddressesPath, "utf-8")
  );

  // Compile contracts to get latest bytecode
  console.log("📦 Compiling contracts...");
  execSync("npx hardhat compile", {
    cwd: projectRoot,
    stdio: "inherit",
  });

  // Check which contracts to upgrade
  const forceUpgrade = boolEnv("FORCE_UPGRADE");
  const dryRun = boolEnv("DRY_RUN");
  const upgradeRariPack = boolEnv("UPGRADE_RARIPACK");
  const upgradeNftPool = boolEnv("UPGRADE_NFTPOOL");
  const upgradePackManager = boolEnv("UPGRADE_PACKMANAGER");
  const upgradeAll = !upgradeRariPack && !upgradeNftPool && !upgradePackManager;

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - will only check for changes, no upgrades\n");
  }

  const contractsToCheck = CONTRACTS.filter((c) => {
    if (upgradeAll) return true;
    if (c.name === "RariPack" && upgradeRariPack) return true;
    if (c.name === "NftPool" && upgradeNftPool) return true;
    if (c.name === "PackManager" && upgradePackManager) return true;
    return false;
  });

  console.log("\n🔍 Checking for implementation changes...\n");

  const upgradesToPerform: { contract: ContractInfo; proxyAdmin: string }[] = [];

  for (const contract of contractsToCheck) {
    const proxyAddress = deployedAddresses[contract.proxyKey];
    const oldImplAddress = deployedAddresses[contract.implKey];

    if (!proxyAddress) {
      console.log(`⚠️  ${contract.name}: Proxy not found, skipping`);
      continue;
    }

    console.log(`📋 ${contract.name}:`);
    console.log(`   Proxy: ${proxyAddress}`);
    console.log(`   Current Impl: ${oldImplAddress}`);

    // Get deployed implementation bytecode (normalize to remove metadata)
    const deployedBytecode = await ethers.provider.getCode(oldImplAddress);
    const normalizedDeployed = normalizeBytecode(deployedBytecode);
    const deployedHash = keccak256(normalizedDeployed);

    // Get compiled bytecode from artifact (normalize to remove metadata)
    const artifactFullPath = path.join(projectRoot, contract.artifactPath);
    if (!fs.existsSync(artifactFullPath)) {
      console.log(`   ⚠️  Artifact not found at ${artifactFullPath}, skipping`);
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactFullPath, "utf-8"));
    const compiledBytecode = artifact.deployedBytecode;
    const normalizedCompiled = normalizeBytecode(compiledBytecode);
    const compiledHash = keccak256(normalizedCompiled);

    console.log(`   Deployed bytecode hash: ${deployedHash.slice(0, 18)}...`);
    console.log(`   Compiled bytecode hash: ${compiledHash.slice(0, 18)}...`);

    const needsUpgrade = deployedHash !== compiledHash;

    if (needsUpgrade || forceUpgrade) {
      console.log(`   ✅ ${needsUpgrade ? "CHANGED" : "FORCE"} - will upgrade`);

      // Get proxy admin address from storage slot
      const adminSlotValue = await ethers.provider.getStorage(proxyAddress, ADMIN_SLOT);
      const proxyAdmin = "0x" + adminSlotValue.slice(26); // Extract address from 32-byte slot

      console.log(`   ProxyAdmin: ${proxyAdmin}`);
      upgradesToPerform.push({ contract, proxyAdmin });
    } else {
      console.log(`   ⏭️  No changes detected`);
    }
    console.log();
  }

  if (upgradesToPerform.length === 0) {
    console.log("✨ All implementations are up to date. No upgrades needed.\n");
    return;
  }

  if (dryRun) {
    console.log(`\n📋 DRY RUN: ${upgradesToPerform.length} contract(s) would be upgraded:`);
    for (const { contract } of upgradesToPerform) {
      console.log(`   - ${contract.name}`);
    }
    console.log("\nRun without DRY_RUN=true to perform the upgrades.\n");
    return;
  }

  console.log(`\n🚀 Performing ${upgradesToPerform.length} upgrade(s)...\n`);

  for (const { contract, proxyAdmin } of upgradesToPerform) {
    const proxyAddress = deployedAddresses[contract.proxyKey];

    console.log(`\n📤 Upgrading ${contract.name}...`);

    // Write parameters for upgrade module
    const paramsPath = path.join(paramsDir, `upgrade${contract.name}.sepolia.json`);
    const params = {
      [`Upgrade${contract.name}Module`]: {
        proxyAdminAddress: proxyAdmin,
        proxyAddress: proxyAddress,
      },
    };

    fs.writeFileSync(paramsPath, JSON.stringify(params, null, 2));
    console.log(`   Wrote parameters to ${paramsPath}`);

    // Run upgrade module (each contract has its own module file)
    const moduleFile = `ignition/modules/Upgrade${contract.name}.ts`;
    const upgradeCmd = `npx hardhat ignition deploy ${moduleFile} --network sepolia --parameters ${paramsPath}`;

    console.log(`   Running: ${upgradeCmd}\n`);

    try {
      execSync(upgradeCmd, {
        cwd: projectRoot,
        stdio: "inherit",
        env: { ...process.env, CI: "true" },
      });

      // Verify the upgrade by checking implementation slot
      const newImplSlotValue = await ethers.provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
      const newImplAddress = "0x" + newImplSlotValue.slice(26);

      console.log(`   ✅ ${contract.name} upgraded!`);
      console.log(`   New implementation: ${newImplAddress}`);

      // Update deployed_addresses.json with new implementation
      deployedAddresses[contract.implKey] = newImplAddress;
      fs.writeFileSync(deployedAddressesPath, JSON.stringify(deployedAddresses, null, 2));
      console.log(`   Updated deployed_addresses.json`);
    } catch (error) {
      console.error(`   ❌ Failed to upgrade ${contract.name}:`, error);
      throw error;
    }
  }

  console.log("\n✨ All upgrades completed successfully!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
