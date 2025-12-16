/// @ai_context
/// Deploys the full Pack stack to Sepolia using Ignition, then deploys multiple ERC721 collections
/// and seeds NFTs into NftPool across all pool levels.
///
/// Env (recommended):
/// - HARDHAT_NETWORK=sepolia
/// - PRIVATE_KEY / accounts configured in hardhat config
/// - PACK_OWNER (optional)                : defaults to first signer
/// - PACK_TREASURY (optional)             : defaults to PACK_OWNER
/// - VRF_COORDINATOR (optional)           : defaults to Sepolia coordinator
/// - VRF_SUBSCRIPTION_ID (required)       : Chainlink VRF sub id for Sepolia
/// - VRF_KEY_HASH (required)              : Chainlink VRF gas lane for Sepolia
/// - ENABLE_INSTANT_CASH (optional)       : "true" to enable instant cash path
/// - PACK_PRICE_{BRONZE|SILVER|GOLD|PLATINUM} (optional, ETH)
/// - POOL_NFTS_{COMMON|RARE|EPIC|LEGENDARY|ULTRARARE} (optional, ints; default 10)
/// - SKIP_INFRA_DEPLOY (optional)         : "true" to skip PackInfrastructure ignition deploy
/// - SKIP_SETUP (optional)               : "true" to skip SetupPackInfrastructure ignition deploy
/// - SKIP_COLLECTIONS (optional)         : "true" to skip deploying/seeding collections
/// - FORCE_RESEED_COLLECTIONS (optional) : "true" to ignore seeded_collections.json and reseed

import { network } from "hardhat";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers as ethersLib } from "ethers";

type JsonObject = Record<string, unknown>;
type DeployedAddresses = Record<string, string>;

const SEPOLIA_CHAIN_ID_DECIMAL = "11155111";
const SEPOLIA_COORDINATOR_DEFAULT = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function boolEnv(name: string, defaultValue = false): boolean {
  const v = (process.env[name] ?? "").trim().toLowerCase();
  if (!v) return defaultValue;
  return v === "true" || v === "1" || v === "yes";
}

function intEnv(name: string, defaultValue: number): number {
  const v = process.env[name];
  if (!v) return defaultValue;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${name}: ${v}`);
  return n;
}

function readJsonFile<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function pickAddress(map: DeployedAddresses, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = map[k];
    if (v && typeof v === "string" && v !== "0x0000000000000000000000000000000000000000") return v;
  }
  return undefined;
}

function loadPackInfrastructureProxies(deployed: DeployedAddresses): {
  rariPackProxy: string;
  packManagerProxy: string;
  nftPoolProxy: string;
} {
  const rariPackProxy = pickAddress(deployed, [
    "PackInfrastructureModule#RariPackProxy",
    "PackInfrastructureModule#rariPackProxy",
  ]);
  const packManagerProxy = pickAddress(deployed, [
    "PackInfrastructureModule#PackManagerProxy",
    "PackInfrastructureModule#packManagerProxy",
  ]);
  const nftPoolProxy = pickAddress(deployed, [
    "PackInfrastructureModule#NftPoolProxy",
    "PackInfrastructureModule#nftPoolProxy",
  ]);

  if (!rariPackProxy || !packManagerProxy || !nftPoolProxy) {
    throw new Error(
      `Could not find PackInfrastructure proxy addresses in deployed_addresses.json (got rariPack=${rariPackProxy}, packManager=${packManagerProxy}, nftPool=${nftPoolProxy})`,
    );
  }

  return { rariPackProxy, packManagerProxy, nftPoolProxy };
}

async function main() {
  const { ethers, networkName } = await network.connect();
  if (networkName !== "sepolia") throw new Error(`Use --network sepolia (current: ${networkName})`);

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No signer available. Check your Hardhat network accounts/private key.");
  const deployerAddress = await deployer.getAddress();

  const owner = (process.env.PACK_OWNER ?? deployerAddress).trim();
  const treasury = (process.env.PACK_TREASURY ?? owner).trim();

  const vrfCoordinator = (process.env.VRF_COORDINATOR ?? SEPOLIA_COORDINATOR_DEFAULT).trim();
  const vrfSubscriptionId = mustGetEnv("VRF_SUBSCRIPTION_ID").trim();
  const vrfKeyHash = mustGetEnv("VRF_KEY_HASH").trim();

  const enableInstantCash = boolEnv("ENABLE_INSTANT_CASH", false);

  const bronzePrice = ethersLib.parseEther(process.env.PACK_PRICE_BRONZE ?? "0.01").toString();
  const silverPrice = ethersLib.parseEther(process.env.PACK_PRICE_SILVER ?? "0.05").toString();
  const goldPrice = ethersLib.parseEther(process.env.PACK_PRICE_GOLD ?? "0.1").toString();
  const platinumPrice = ethersLib.parseEther(process.env.PACK_PRICE_PLATINUM ?? "0.5").toString();

  const bronzeUri = process.env.PACK_URI_BRONZE ?? "ipfs://sepolia-pack-bronze";
  const silverUri = process.env.PACK_URI_SILVER ?? "ipfs://sepolia-pack-silver";
  const goldUri = process.env.PACK_URI_GOLD ?? "ipfs://sepolia-pack-gold";
  const platinumUri = process.env.PACK_URI_PLATINUM ?? "ipfs://sepolia-pack-platinum";

  const bronzeDescription = process.env.PACK_DESC_BRONZE ?? "Bronze pack for entry-level pulls from the common pool.";
  const silverDescription = process.env.PACK_DESC_SILVER ?? "Silver pack with better chances into the rare pool.";
  const goldDescription = process.env.PACK_DESC_GOLD ?? "Gold pack offering improved odds across rare and epic pools.";
  const platinumDescription =
    process.env.PACK_DESC_PLATINUM ?? "Platinum pack with the best odds and access to the ultra-rare pool.";

  const skipInfraDeploy = boolEnv("SKIP_INFRA_DEPLOY", false);
  const skipSetup = boolEnv("SKIP_SETUP", false);
  const skipCollections = boolEnv("SKIP_COLLECTIONS", false);
  const forceReseed = boolEnv("FORCE_RESEED_COLLECTIONS", false);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, "..");
  const paramsDir = path.join(projectRoot, "ignition", "parameters");
  const deploymentsDir = path.join(projectRoot, "ignition", "deployments", `chain-${SEPOLIA_CHAIN_ID_DECIMAL}`);
  const deployedAddressesPath = path.join(deploymentsDir, "deployed_addresses.json");

  const infraParamsPath = path.join(paramsDir, "packInfrastructure.sepolia.json");
  const setupParamsPath = path.join(paramsDir, "setupPackInfrastructure.sepolia.json");
  const seededCollectionsPath = path.join(deploymentsDir, "seeded_collections.json");

  // ------------------------------------------------------------
  // 1) Deploy infrastructure (Ignition)
  // ------------------------------------------------------------
  const infraParams: JsonObject = {
    PackInfrastructureModule: {
      owner,
      treasury,
      packName: "Rari Pack",
      packSymbol: "RPACK",
      useCustomPoolRanges: false,
      customPoolRanges: [],
    },
  };

  if (!skipInfraDeploy) {
    const alreadyDeployed = (() => {
      const existing = readJsonFile<DeployedAddresses>(deployedAddressesPath);
      if (!existing) return false;
      try {
        loadPackInfrastructureProxies(existing);
        return true;
      } catch {
        return false;
      }
    })();

    if (!alreadyDeployed) {
      writeJsonFile(infraParamsPath, infraParams);
      console.log(`Wrote infra parameters to ${infraParamsPath}`);

      const infraCmd = `npx hardhat ignition deploy ignition/modules/PackInfrastructure.ts --network sepolia --parameters ${infraParamsPath}`;
      console.log(`\nDeploying PackInfrastructure...\nRunning: ${infraCmd}\n`);
      execSync(infraCmd, {
        cwd: projectRoot,
        stdio: "inherit",
        env: { ...process.env, CI: "true" },
      });
    } else {
      console.log(`\nPackInfrastructure already deployed (found proxies in ${deployedAddressesPath}). Skipping infra deploy.\n`);
    }
  } else {
    console.log("\nSKIP_INFRA_DEPLOY=true: skipping PackInfrastructure ignition deploy.\n");
  }

  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error(`Deployed addresses not found at ${deployedAddressesPath}. Did infra deploy run successfully?`);
  }

  const deployedAddresses = readJsonFile<DeployedAddresses>(deployedAddressesPath);
  if (!deployedAddresses) throw new Error(`Failed to parse ${deployedAddressesPath}`);

  const { rariPackProxy, packManagerProxy, nftPoolProxy } = loadPackInfrastructureProxies(deployedAddresses);

  console.log("\nInfrastructure addresses:");
  console.log(`- RariPack proxy:     ${rariPackProxy}`);
  console.log(`- PackManager proxy:  ${packManagerProxy}`);
  console.log(`- NftPool proxy:      ${nftPoolProxy}`);

  // ------------------------------------------------------------
  // 2) Run setup (Ignition) - idempotent
  // ------------------------------------------------------------
  if (!skipSetup) {
    const setupParams: JsonObject = {
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

    writeJsonFile(setupParamsPath, setupParams);
    console.log(`\nWrote setup parameters to ${setupParamsPath}`);

    const setupCmd = `npx hardhat ignition deploy ignition/modules/SetupPackInfrastructure.ts --network sepolia --parameters ${setupParamsPath}`;
    console.log(`\nRunning setup...\nRunning: ${setupCmd}\n`);

    execSync(setupCmd, {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    });

    console.log("\nSetup complete.");
  } else {
    console.log("\nSKIP_SETUP=true: skipping SetupPackInfrastructure ignition deploy.\n");
  }

  // ------------------------------------------------------------
  // 3) Deploy & seed multiple collections into NftPool
  // ------------------------------------------------------------
  if (skipCollections) {
    console.log("\nSKIP_COLLECTIONS=true: skipping collection deploy/seed.\n");
    return;
  }

  const POOL_MANAGER_ROLE = ethersLib.keccak256(ethersLib.toUtf8Bytes("POOL_MANAGER_ROLE"));

  const nftPool = await ethers.getContractAt("NftPool", nftPoolProxy, deployer);

  // Ensure deployer can call configureCollection (grant POOL_MANAGER_ROLE to deployer if missing)
  const hasPoolManagerRole: boolean = await nftPool.hasRole(POOL_MANAGER_ROLE, deployerAddress);
  if (!hasPoolManagerRole) {
    console.log(`\nGranting POOL_MANAGER_ROLE to deployer (${deployerAddress}) on NftPool...`);
    const tx = await nftPool.grantRole(POOL_MANAGER_ROLE, deployerAddress);
    await tx.wait();
    console.log("Granted POOL_MANAGER_ROLE to deployer.");
  } else {
    console.log(`\nDeployer already has POOL_MANAGER_ROLE on NftPool.`);
  }

  const existingSeeded = !forceReseed ? readJsonFile<Record<string, unknown>>(seededCollectionsPath) : undefined;
  if (existingSeeded && typeof existingSeeded === "object") {
    console.log(`\nFound existing ${seededCollectionsPath}. Set FORCE_RESEED_COLLECTIONS=true to redeploy/reseed.\n`);
    console.log(JSON.stringify(existingSeeded, null, 2));
    return;
  }

  const counts = {
    common: intEnv("POOL_NFTS_COMMON", 10),
    rare: intEnv("POOL_NFTS_RARE", 10),
    epic: intEnv("POOL_NFTS_EPIC", 10),
    legendary: intEnv("POOL_NFTS_LEGENDARY", 10),
    ultrarare: intEnv("POOL_NFTS_ULTRARARE", 10),
  };

  const collectionSpecs = [
    { key: "Common", name: "Sepolia Mock Common", symbol: "SMC", floorWei: ethersLib.parseEther("0.1"), count: counts.common },
    { key: "Rare", name: "Sepolia Mock Rare", symbol: "SMR", floorWei: ethersLib.parseEther("1"), count: counts.rare },
    { key: "Epic", name: "Sepolia Mock Epic", symbol: "SME", floorWei: ethersLib.parseEther("3"), count: counts.epic },
    { key: "Legendary", name: "Sepolia Mock Legendary", symbol: "SML", floorWei: ethersLib.parseEther("20"), count: counts.legendary },
    { key: "UltraRare", name: "Sepolia Mock UltraRare", symbol: "SMU", floorWei: ethersLib.parseEther("60"), count: counts.ultrarare },
  ].filter((s) => s.count > 0);

  console.log(`\nDeploying and seeding ${collectionSpecs.length} collections into NftPool...`);

  const MockCollectionFactory = await ethers.getContractFactory("MockCollection721", deployer);

  const seeded: Record<string, unknown> = {
    network: "sepolia",
    nftPool: nftPoolProxy,
    owner,
    deployer: deployerAddress,
    collections: [] as Array<Record<string, unknown>>,
  };

  for (const spec of collectionSpecs) {
    console.log(`\n--- ${spec.key} collection ---`);
    console.log(`Deploying ${spec.name} (${spec.symbol})...`);

    const collection = await MockCollectionFactory.deploy(spec.name, spec.symbol, owner);
    await collection.waitForDeployment();
    const collectionAddress = await collection.getAddress();

    console.log(`Deployed at: ${collectionAddress}`);
    console.log(`Configuring collection floorPrice=${spec.floorWei.toString()} wei...`);

    const cfgTx = await nftPool.configureCollection(collectionAddress, true, spec.floorWei);
    await cfgTx.wait();

    console.log(`Minting ${spec.count} NFTs to ${owner}...`);
    const beforeNextId: bigint = await collection.nextId();
    const mintTx = await collection.mintBatch(owner, BigInt(spec.count));
    await mintTx.wait();
    const startId = beforeNextId + 1n;
    const endId = beforeNextId + BigInt(spec.count);

    console.log(`Minted tokenIds: ${startId}..${endId}`);

    // Approve NftPool once for all tokens
    const approveTx = await collection.setApprovalForAll(nftPoolProxy, true);
    await approveTx.wait();

    console.log(`Depositing tokenIds into NftPool...`);
    for (let id = startId; id <= endId; id++) {
      const depTx = await nftPool.deposit(collectionAddress, id);
      await depTx.wait();
    }

    console.log(`Seeded ${spec.count} NFTs into NftPool for ${spec.key}.`);

    (seeded.collections as Array<Record<string, unknown>>).push({
      level: spec.key,
      address: collectionAddress,
      name: spec.name,
      symbol: spec.symbol,
      floorPriceWei: spec.floorWei.toString(),
      minted: spec.count,
      tokenIdRange: { start: startId.toString(), end: endId.toString() },
    });
  }

  writeJsonFile(seededCollectionsPath, seeded);
  console.log(`\nWrote seeded collections info to: ${seededCollectionsPath}`);

  console.log("\nAll done.");
  console.log("\nReminder: add PackManager proxy as a consumer on your Chainlink VRF subscription:");
  console.log(`- PackManager proxy: ${packManagerProxy}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});