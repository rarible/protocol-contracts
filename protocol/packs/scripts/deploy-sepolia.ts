import hre from "hardhat";
import { ethers } from "ethers";
import PackInfrastructureModule from "../ignition/modules/PackInfrastructure";
import SetupPackInfrastructureModule from "../ignition/modules/SetupPackInfrastructure";

/**
 * Deploys the full pack stack to Sepolia using Ignition, then wires it up.
 * Reads configuration from environment variables so secrets stay out of git:
 * - PACK_OWNER (optional)          : owner/admin; defaults to requestor address
 * - PACK_TREASURY (optional)       : treasury; defaults to owner
 * - VRF_COORDINATOR (optional)     : defaults to Sepolia coordinator
 * - VRF_SUBSCRIPTION_ID (required) : Chainlink VRF sub id for Sepolia
 * - VRF_KEY_HASH (required)        : Chainlink VRF gas lane for Sepolia
 * - PACK_*_URI / PACK_*_DESCRIPTION (optional) : overrides for pack metadata
 * - PACK_PRICES_* (optional)       : per-pack prices in ETH (bronze|silver|gold|platinum)
 * - ENABLE_INSTANT_CASH (optional) : "true" to enable instant cash path
 */
async function main() {
  const hreAny = hre as any;
  const networkName: string =
    hreAny.network?.name ??
    hreAny.hardhatArguments?.network ??
    process.env.HARDHAT_NETWORK ??
    "unknown";

  if (networkName !== "sepolia") {
    // Hard guard to avoid accidental mainnet deploys.
    throw new Error(`Use --network sepolia (current: ${networkName})`);
  }

  const owner = process.env.PACK_OWNER ?? "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4";
  const treasury = process.env.PACK_TREASURY ?? owner;

  const vrfCoordinator = process.env.VRF_COORDINATOR ?? "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const vrfSubscriptionId = process.env.VRF_SUBSCRIPTION_ID;
  const vrfKeyHash = process.env.VRF_KEY_HASH;

  if (!vrfSubscriptionId || !vrfKeyHash) {
    throw new Error("Set VRF_SUBSCRIPTION_ID and VRF_KEY_HASH in env for Sepolia");
  }

  const enableInstantCash = (process.env.ENABLE_INSTANT_CASH ?? "false").toLowerCase() === "true";

  const bronzePrice = ethers.parseEther(process.env.PACK_PRICE_BRONZE ?? "0.01");
  const silverPrice = ethers.parseEther(process.env.PACK_PRICE_SILVER ?? "0.05");
  const goldPrice = ethers.parseEther(process.env.PACK_PRICE_GOLD ?? "0.1");
  const platinumPrice = ethers.parseEther(process.env.PACK_PRICE_PLATINUM ?? "0.5");

  const bronzeUri = process.env.PACK_URI_BRONZE ?? "ipfs://sepolia-pack-bronze";
  const silverUri = process.env.PACK_URI_SILVER ?? "ipfs://sepolia-pack-silver";
  const goldUri = process.env.PACK_URI_GOLD ?? "ipfs://sepolia-pack-gold";
  const platinumUri = process.env.PACK_URI_PLATINUM ?? "ipfs://sepolia-pack-platinum";

  const bronzeDescription =
    process.env.PACK_DESC_BRONZE ?? "Bronze pack for entry-level pulls from the common pool.";
  const silverDescription =
    process.env.PACK_DESC_SILVER ?? "Silver pack with better chances into the rare pool.";
  const goldDescription =
    process.env.PACK_DESC_GOLD ?? "Gold pack offering improved odds across rare and epic pools.";
  const platinumDescription =
    process.env.PACK_DESC_PLATINUM ??
    "Platinum pack with the best odds and access to the ultra-rare pool.";

  console.log("Deploying pack infrastructure to Sepolia...");
  console.log(`Owner:    ${owner}`);
  console.log(`Treasury: ${treasury}`);

  const infra = await hreAny.ignition.deploy(PackInfrastructureModule, {
    parameters: {
      PackInfrastructureModule: {
        owner,
        treasury,
        packName: "Rari Pack",
        packSymbol: "RPACK",
        useCustomPoolRanges: false,
        customPoolRanges: [],
      },
    },
  });

  const rariPackProxy = infra.rariPackProxy.address;
  const packManagerProxy = infra.packManagerProxy.address;
  const nftPoolProxy = infra.nftPoolProxy.address;

  console.log("Infrastructure deployed:");
  console.log(`- RariPack proxy:     ${rariPackProxy}`);
  console.log(`- PackManager proxy:  ${packManagerProxy}`);
  console.log(`- NftPool proxy:      ${nftPoolProxy}`);

  console.log("Running setup module...");
  await hreAny.ignition.deploy(SetupPackInfrastructureModule, {
    parameters: {
      SetupPackInfrastructureModule: {
        rariPackProxy,
        packManagerProxy,
        nftPoolProxy,
        vrfCoordinator,
        vrfSubscriptionId: BigInt(vrfSubscriptionId),
        vrfKeyHash,
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
    },
  });

  console.log("Setup complete. Contracts are fully configured.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

