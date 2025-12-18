/// @ai_context
/// Script to enable instant cash on PackManager

import { network } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const connection = await network.connect();
  const networkName = connection.networkName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethers = (connection as any).ethers;

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`\n🔧 Enable Instant Cash on ${networkName}`);
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
  const packManagerProxy = deployedAddresses["PackInfrastructureModule#PackManagerProxy"];

  console.log(`📋 PackManager Proxy: ${packManagerProxy}`);

  // Get PackManager contract
  const PackManager = await ethers.getContractFactory("PackManager");
  const packManager = PackManager.attach(packManagerProxy).connect(signer);

  // Check current status
  const currentEnabled = await packManager.instantCashEnabled();
  console.log(`📊 Current instant cash enabled: ${currentEnabled}`);

  if (currentEnabled) {
    console.log(`\n✅ Instant cash is already enabled!`);
    return;
  }

  // Enable instant cash
  console.log(`\n🔄 Enabling instant cash...`);
  const tx = await packManager.setInstantCashEnabled(true);
  console.log(`   Transaction: ${tx.hash}`);
  console.log(`   Waiting for confirmation...`);
  await tx.wait();

  // Verify
  const newEnabled = await packManager.instantCashEnabled();
  console.log(`\n✅ Instant cash enabled: ${newEnabled}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
