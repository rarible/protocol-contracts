// Hardhat Ignition module for setting up Pack Infrastructure relationships
// Run this after deploying PackInfrastructure module
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

// Pool types (ordered from common to rare for extensibility)
const PoolType = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  UltraRare: 4,
};

// Pack types
const PackType = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
};

// Role constants
const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
const POOL_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("POOL_MANAGER_ROLE"));

const SetupPackInfrastructureModule = buildModule("SetupPackInfrastructureModule", (m) => {
  // ============================================
  // Parameters - Deployed Addresses
  // ============================================
  const rariPackProxy = m.getParameter<string>("rariPackProxy");
  const packManagerProxy = m.getParameter<string>("packManagerProxy");
  const commonPool = m.getParameter<string>("commonPool");
  const rarePool = m.getParameter<string>("rarePool");
  const epicPool = m.getParameter<string>("epicPool");
  const legendaryPool = m.getParameter<string>("legendaryPool");
  const ultraRarePool = m.getParameter<string>("ultraRarePool");

  // VRF Configuration
  const vrfCoordinator = m.getParameter<string>("vrfCoordinator");
  const vrfSubscriptionId = m.getParameter<bigint>("vrfSubscriptionId");
  const vrfKeyHash = m.getParameter<string>("vrfKeyHash");
  const vrfCallbackGasLimit = m.getParameter<number>("vrfCallbackGasLimit", 500000);
  const vrfRequestConfirmations = m.getParameter<number>("vrfRequestConfirmations", 3);

  // Pack prices in wei
  const bronzePrice = m.getParameter<bigint>("bronzePrice", ethers.parseEther("0.01"));
  const silverPrice = m.getParameter<bigint>("silverPrice", ethers.parseEther("0.05"));
  const goldPrice = m.getParameter<bigint>("goldPrice", ethers.parseEther("0.1"));
  const platinumPrice = m.getParameter<bigint>("platinumPrice", ethers.parseEther("0.5"));

  // Pack URIs
  const bronzeUri = m.getParameter<string>("bronzeUri", "");
  const silverUri = m.getParameter<string>("silverUri", "");
  const goldUri = m.getParameter<string>("goldUri", "");
  const platinumUri = m.getParameter<string>("platinumUri", "");

  // ============================================
  // Get Contract Artifacts for Call Encoding
  // ============================================
  const rariPackArtifact = m.contractAt("RariPack", rariPackProxy, {
    id: "RariPackInstance",
  });

  const packManagerArtifact = m.contractAt("PackManager", packManagerProxy, {
    id: "PackManagerInstance",
  });

  const commonPoolArtifact = m.contractAt("NftPool", commonPool, {
    id: "CommonPoolInstance",
  });

  const rarePoolArtifact = m.contractAt("NftPool", rarePool, {
    id: "RarePoolInstance",
  });

  const epicPoolArtifact = m.contractAt("NftPool", epicPool, {
    id: "EpicPoolInstance",
  });

  const legendaryPoolArtifact = m.contractAt("NftPool", legendaryPool, {
    id: "LegendaryPoolInstance",
  });

  const ultraRarePoolArtifact = m.contractAt("NftPool", ultraRarePool, {
    id: "UltraRarePoolInstance",
  });

  // ============================================
  // 1. Grant BURNER_ROLE to PackManager on RariPack
  // ============================================
  const grantBurnerRole = m.call(rariPackArtifact, "grantRole", [BURNER_ROLE, packManagerProxy], {
    id: "GrantBurnerRoleToPackManager",
  });

  // ============================================
  // 2. Grant POOL_MANAGER_ROLE to PackManager on all pools
  // ============================================
  const grantPoolManagerCommon = m.call(
    commonPoolArtifact,
    "grantRole",
    [POOL_MANAGER_ROLE, packManagerProxy],
    { id: "GrantPoolManagerCommon" }
  );

  const grantPoolManagerRare = m.call(
    rarePoolArtifact,
    "grantRole",
    [POOL_MANAGER_ROLE, packManagerProxy],
    { id: "GrantPoolManagerRare" }
  );

  const grantPoolManagerEpic = m.call(
    epicPoolArtifact,
    "grantRole",
    [POOL_MANAGER_ROLE, packManagerProxy],
    { id: "GrantPoolManagerEpic" }
  );

  const grantPoolManagerLegendary = m.call(
    legendaryPoolArtifact,
    "grantRole",
    [POOL_MANAGER_ROLE, packManagerProxy],
    { id: "GrantPoolManagerLegendary" }
  );

  const grantPoolManagerUltraRare = m.call(
    ultraRarePoolArtifact,
    "grantRole",
    [POOL_MANAGER_ROLE, packManagerProxy],
    { id: "GrantPoolManagerUltraRare" }
  );

  // ============================================
  // 3. Set pools in PackManager
  // ============================================
  const setCommonPool = m.call(packManagerArtifact, "setPool", [PoolType.Common, commonPool], {
    id: "SetCommonPool",
    after: [grantPoolManagerCommon],
  });

  const setRarePool = m.call(packManagerArtifact, "setPool", [PoolType.Rare, rarePool], {
    id: "SetRarePool",
    after: [grantPoolManagerRare],
  });

  const setEpicPool = m.call(packManagerArtifact, "setPool", [PoolType.Epic, epicPool], {
    id: "SetEpicPool",
    after: [grantPoolManagerEpic],
  });

  const setLegendaryPool = m.call(
    packManagerArtifact,
    "setPool",
    [PoolType.Legendary, legendaryPool],
    {
      id: "SetLegendaryPool",
      after: [grantPoolManagerLegendary],
    }
  );

  const setUltraRarePool = m.call(
    packManagerArtifact,
    "setPool",
    [PoolType.UltraRare, ultraRarePool],
    {
      id: "SetUltraRarePool",
      after: [grantPoolManagerUltraRare],
    }
  );

  // ============================================
  // 4. Configure VRF on PackManager
  // ============================================
  const setVrfConfig = m.call(
    packManagerArtifact,
    "setVrfConfig",
    [vrfCoordinator, vrfSubscriptionId, vrfKeyHash, vrfCallbackGasLimit, vrfRequestConfirmations],
    {
      id: "SetVrfConfig",
    }
  );

  // ============================================
  // 5. Set pack prices on RariPack
  // ============================================
  const setBronzePrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Bronze, bronzePrice], {
    id: "SetBronzePrice",
  });

  const setSilverPrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Silver, silverPrice], {
    id: "SetSilverPrice",
  });

  const setGoldPrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Gold, goldPrice], {
    id: "SetGoldPrice",
  });

  const setPlatinumPrice = m.call(
    rariPackArtifact,
    "setPackPrice",
    [PackType.Platinum, platinumPrice],
    {
      id: "SetPlatinumPrice",
    }
  );

  // ============================================
  // 6. Set pack URIs on RariPack (if provided)
  // ============================================
  const setBronzeUri = m.call(rariPackArtifact, "setPackURI", [PackType.Bronze, bronzeUri], {
    id: "SetBronzeUri",
  });

  const setSilverUri = m.call(rariPackArtifact, "setPackURI", [PackType.Silver, silverUri], {
    id: "SetSilverUri",
  });

  const setGoldUri = m.call(rariPackArtifact, "setPackURI", [PackType.Gold, goldUri], {
    id: "SetGoldUri",
  });

  const setPlatinumUri = m.call(rariPackArtifact, "setPackURI", [PackType.Platinum, platinumUri], {
    id: "SetPlatinumUri",
  });

  return {
    grantBurnerRole,
    grantPoolManagerCommon,
    grantPoolManagerRare,
    grantPoolManagerEpic,
    grantPoolManagerLegendary,
    grantPoolManagerUltraRare,
    setCommonPool,
    setRarePool,
    setEpicPool,
    setLegendaryPool,
    setUltraRarePool,
    setVrfConfig,
    setBronzePrice,
    setSilverPrice,
    setGoldPrice,
    setPlatinumPrice,
    setBronzeUri,
    setSilverUri,
    setGoldUri,
    setPlatinumUri,
  };
});

export default SetupPackInfrastructureModule;

