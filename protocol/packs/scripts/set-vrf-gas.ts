/// @ai_context
/// Script to update VRF callback gas limit on PackManager
///
/// Usage: npx hardhat run scripts/set-vrf-gas.ts --network sepolia
/// Env:
/// - CALLBACK_GAS_LIMIT: The gas limit to set (default: 1000000000 = 1 gwei worth in gas units)

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

  if (networkName !== "sepolia") {
    throw new Error(`Use --network sepolia (current: ${networkName})`);
  }

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`\n🔧 Setting VRF gas limit on ${networkName}`);
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

  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error(`No deployment found at ${deployedAddressesPath}`);
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf-8"));
  const packManagerProxy = deployedAddresses["PackInfrastructureModule#PackManagerProxy"];

  if (!packManagerProxy) {
    throw new Error("PackManager proxy address not found in deployed_addresses.json");
  }

  console.log(`📋 PackManager Proxy: ${packManagerProxy}`);

  // Get PackManager contract
  const PackManager = await ethers.getContractFactory("PackManager");
  const packManager = PackManager.attach(packManagerProxy).connect(signer);

  // Read current VRF config
  const currentCoordinator = await packManager.vrfCoordinator();
  const currentSubscriptionId = await packManager.vrfSubscriptionId();
  const currentKeyHash = await packManager.vrfKeyHash();
  const currentCallbackGasLimit = await packManager.vrfCallbackGasLimit();
  const currentRequestConfirmations = await packManager.vrfRequestConfirmations();

  console.log(`\n📊 Current VRF Config:`);
  console.log(`   Coordinator: ${currentCoordinator}`);
  console.log(`   Subscription ID: ${currentSubscriptionId}`);
  console.log(`   Key Hash: ${currentKeyHash}`);
  console.log(`   Callback Gas Limit: ${currentCallbackGasLimit}`);
  console.log(`   Request Confirmations: ${currentRequestConfirmations}`);

  // New gas limit - 1 gwei = 1,000,000,000
  const newCallbackGasLimit = process.env.CALLBACK_GAS_LIMIT 
    ? parseInt(process.env.CALLBACK_GAS_LIMIT) 
    : 1_000_000_000; // 1 gwei = 1e9

  if (currentCallbackGasLimit === BigInt(newCallbackGasLimit)) {
    console.log(`\n✅ Callback gas limit is already set to ${newCallbackGasLimit}`);
    return;
  }

  console.log(`\n🔄 Updating callback gas limit: ${currentCallbackGasLimit} → ${newCallbackGasLimit}`);

  // Call setVrfConfig with new gas limit
  const tx = await packManager.setVrfConfig(
    currentCoordinator,
    currentSubscriptionId,
    currentKeyHash,
    newCallbackGasLimit,
    currentRequestConfirmations
  );

  console.log(`   Transaction: ${tx.hash}`);
  console.log(`   Waiting for confirmation...`);

  await tx.wait();

  // Verify the change
  const updatedGasLimit = await packManager.vrfCallbackGasLimit();
  console.log(`\n✅ VRF callback gas limit updated to: ${updatedGasLimit}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
