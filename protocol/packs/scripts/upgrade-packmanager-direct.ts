/// @ai_context
/// Direct upgrade script for PackManager - deploys new implementation and upgrades proxy

import { network } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

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
  console.log(`\n🔧 Direct PackManager upgrade on ${networkName}`);
  console.log(`   Signer: ${signerAddress}\n`);

  // Load deployed addresses
  const projectRoot = path.resolve(__dirname, "..");
  const deployedAddressesPath = path.join(
    projectRoot,
    "ignition",
    "deployments",
    "chain-11155111",
    "deployed_addresses.json"
  );

  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf-8"));
  const proxyAddress = deployedAddresses["PackInfrastructureModule#PackManagerProxy"];

  console.log(`📋 PackManager Proxy: ${proxyAddress}`);

  // Get current implementation
  const currentImplSlot = await ethers.provider.getStorage(proxyAddress, IMPL_SLOT);
  const currentImpl = "0x" + currentImplSlot.slice(26);
  console.log(`📦 Current Implementation: ${currentImpl}`);

  // Get ProxyAdmin address
  const adminSlot = await ethers.provider.getStorage(proxyAddress, ADMIN_SLOT);
  const proxyAdminAddress = "0x" + adminSlot.slice(26);
  console.log(`🔑 ProxyAdmin: ${proxyAdminAddress}`);

  // Deploy new implementation
  console.log(`\n📤 Deploying new PackManager implementation...`);
  const PackManager = await ethers.getContractFactory("PackManager");
  const newImpl = await PackManager.deploy();
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log(`   New Implementation: ${newImplAddress}`);

  // Get ProxyAdmin contract
  const proxyAdminAbi = [
    "function upgradeAndCall(address proxy, address implementation, bytes memory data) external",
    "function upgrade(address proxy, address implementation) external"
  ];
  const proxyAdmin = new ethers.Contract(proxyAdminAddress, proxyAdminAbi, signer);

  // Upgrade the proxy
  console.log(`\n🔄 Upgrading proxy...`);
  const tx = await proxyAdmin.upgradeAndCall(proxyAddress, newImplAddress, "0x");
  console.log(`   Transaction: ${tx.hash}`);
  await tx.wait();

  // Verify upgrade
  const newImplSlot = await ethers.provider.getStorage(proxyAddress, IMPL_SLOT);
  const verifiedImpl = "0x" + newImplSlot.slice(26);
  console.log(`\n✅ Upgrade complete!`);
  console.log(`   Verified Implementation: ${verifiedImpl}`);

  // Update deployed_addresses.json
  deployedAddresses["PackInfrastructureModule#PackManagerImplementation"] = newImplAddress;
  fs.writeFileSync(deployedAddressesPath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`   Updated deployed_addresses.json`);

  console.log(`\n📝 To verify: npx hardhat verify --network sepolia ${newImplAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
