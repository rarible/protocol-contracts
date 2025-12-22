import { execSync } from "child_process";
import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploys the full pack stack to Base mainnet using Ignition CLI, then wires it up.
 * Reads configuration from environment variables so secrets stay out of git:
 * - PACK_OWNER (optional)              : owner/admin; defaults to requestor address
 * - PACK_TREASURY (optional)           : treasury; defaults to owner
 * - BASE_VRF_COORDINATOR / VRF_COORDINATOR (required)
 * - BASE_VRF_SUBSCRIPTION_ID / VRF_SUBSCRIPTION_ID (required)
 * - BASE_VRF_KEY_HASH / VRF_KEY_HASH (required)
 * - PACK_*_URI / PACK_*_DESCRIPTION (optional) : overrides for pack metadata
 * - PACK_PRICE_* (optional)            : per-pack prices in ETH (bronze|silver|gold|platinum)
 * - ENABLE_INSTANT_CASH (optional)     : "true" to enable instant cash path
 */
async function main() {
  const { ethers, networkName } = await network.connect();

  if (networkName !== "base") {
    throw new Error(`Use --network base (current: ${networkName})`);
  }

  const owner = process.env.PACK_OWNER ?? "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4";
  const treasury = process.env.PACK_TREASURY ?? owner;

  const vrfCoordinator = process.env.BASE_VRF_COORDINATOR ?? process.env.VRF_COORDINATOR;
  const vrfSubscriptionId =
    process.env.BASE_VRF_SUBSCRIPTION_ID ?? process.env.VRF_SUBSCRIPTION_ID;
  const vrfKeyHash = process.env.BASE_VRF_KEY_HASH ?? process.env.VRF_KEY_HASH;

  if (!vrfCoordinator || !vrfSubscriptionId || !vrfKeyHash) {
    throw new Error("Set BASE_VRF_COORDINATOR, BASE_VRF_SUBSCRIPTION_ID, BASE_VRF_KEY_HASH");
  }

  const enableInstantCash = (process.env.ENABLE_INSTANT_CASH ?? "false").toLowerCase() === "true";

  const bronzePrice = ethers.parseEther(process.env.PACK_PRICE_BRONZE ?? "0.01").toString();
  const silverPrice = ethers.parseEther(process.env.PACK_PRICE_SILVER ?? "0.05").toString();
  const goldPrice = ethers.parseEther(process.env.PACK_PRICE_GOLD ?? "0.1").toString();
  const platinumPrice = ethers.parseEther(process.env.PACK_PRICE_PLATINUM ?? "0.5").toString();

  const bronzeUri = process.env.PACK_URI_BRONZE ?? "ipfs://base-pack-bronze";
  const silverUri = process.env.PACK_URI_SILVER ?? "ipfs://base-pack-silver";
  const goldUri = process.env.PACK_URI_GOLD ?? "ipfs://base-pack-gold";
  const platinumUri = process.env.PACK_URI_PLATINUM ?? "ipfs://base-pack-platinum";

  const bronzeDescription =
    process.env.PACK_DESC_BRONZE ?? "Bronze pack for entry-level pulls from the common pool.";
  const silverDescription =
    process.env.PACK_DESC_SILVER ?? "Silver pack with better chances into the rare pool.";
  const goldDescription =
    process.env.PACK_DESC_GOLD ?? "Gold pack offering improved odds across rare and epic pools.";
  const platinumDescription =
    process.env.PACK_DESC_PLATINUM ??
    "Platinum pack with the best odds and access to the ultra-rare pool.";

  // Paths
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const paramsDir = path.join(projectRoot, "ignition", "parameters");
  const infraParamsPath = path.join(paramsDir, "packInfrastructure.base.json");
  const setupParamsPath = path.join(paramsDir, "setupPackInfrastructure.base.json");

  // Write infrastructure parameters
  const infraParams = {
    PackInfrastructureModule: {
      owner,
      treasury,
      packName: "Rari Pack",
      packSymbol: "RPACK",
      useCustomPoolRanges: false,
      customPoolRanges: [],
    },
  };

  fs.writeFileSync(infraParamsPath, JSON.stringify(infraParams, null, 2));
  console.log(`Wrote parameters to ${infraParamsPath}`);

  console.log("\nDeploying pack infrastructure to Base...");
  console.log(`Owner:    ${owner}`);
  console.log(`Treasury: ${treasury}\n`);

  // Deploy infrastructure module via CLI
  const infraCmd = `npx hardhat ignition deploy ignition/modules/PackInfrastructure.ts --network base --parameters ${infraParamsPath}`;
  console.log(`Running: ${infraCmd}\n`);

  execSync(infraCmd, {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });

  // Parse deployed addresses from ignition deployments
  const deploymentsDir = path.join(projectRoot, "ignition", "deployments", "chain-8453");
  const deployedAddressesPath = path.join(deploymentsDir, "deployed_addresses.json");

  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error(`Deployed addresses not found at ${deployedAddressesPath}`);
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf-8"));

  // Find the proxy addresses from the deployment
  const rariPackProxy =
    deployedAddresses["PackInfrastructureModule#RariPackProxy"] ??
    deployedAddresses["PackInfrastructureModule#rariPackProxy"];
  const packManagerProxy =
    deployedAddresses["PackInfrastructureModule#PackManagerProxy"] ??
    deployedAddresses["PackInfrastructureModule#packManagerProxy"];
  const nftPoolProxy =
    deployedAddresses["PackInfrastructureModule#NftPoolProxy"] ??
    deployedAddresses["PackInfrastructureModule#nftPoolProxy"];

  if (!rariPackProxy || !packManagerProxy || !nftPoolProxy) {
    console.log("Available deployed addresses:", JSON.stringify(deployedAddresses, null, 2));
    throw new Error("Could not find all proxy addresses in deployed_addresses.json");
  }

  console.log("\nInfrastructure deployed:");
  console.log(`- RariPack proxy:     ${rariPackProxy}`);
  console.log(`- PackManager proxy:  ${packManagerProxy}`);
  console.log(`- NftPool proxy:      ${nftPoolProxy}`);

  // Write setup parameters
  const setupParams = {
    SetupPackInfrastructureModule: {
      rariPackProxy,
      packManagerProxy,
      nftPoolProxy,
      vrfCoordinator,
      vrfSubscriptionId,
      vrfKeyHash,
      vrfCallbackGasLimit: 500000,
      vrfRequestConfirmations: 3,
      bronzePrice,
      silverPrice,
      goldPrice,
      platinumPrice,
      bronzeUri,
      silverUri,
      goldUri,
      platinumUri,
      bronzeDescription,
      silverDescription,
      goldDescription,
      platinumDescription,
      enableInstantCash,
    },
  };

  fs.writeFileSync(setupParamsPath, JSON.stringify(setupParams, null, 2));
  console.log(`\nWrote parameters to ${setupParamsPath}`);

  console.log("\nRunning setup module...");

  // Deploy setup module via CLI
  const setupCmd = `npx hardhat ignition deploy ignition/modules/SetupPackInfrastructure.ts --network base --parameters ${setupParamsPath}`;
  console.log(`Running: ${setupCmd}\n`);

  execSync(setupCmd, {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });

  console.log("\nSetup complete. Contracts are fully configured.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
