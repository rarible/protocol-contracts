// Hardhat Ignition module for setting up Pack Infrastructure relationships
// Run this after deploying PackInfrastructure module
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

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
  const nftPoolProxy = m.getParameter<string>("nftPoolProxy");

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

  // Pack Descriptions
  const bronzeDescription = m.getParameter<string>("bronzeDescription", "");
  const silverDescription = m.getParameter<string>("silverDescription", "");
  const goldDescription = m.getParameter<string>("goldDescription", "");
  const platinumDescription = m.getParameter<string>("platinumDescription", "");

  // Instant Cash Configuration
  const enableInstantCash = m.getParameter<boolean>("enableInstantCash", false);

  // ============================================
  // Get Contract Artifacts for Call Encoding
  // ============================================
  const rariPackArtifact = m.contractAt("RariPack", rariPackProxy, {
    id: "RariPackInstance",
  });

  const packManagerArtifact = m.contractAt("PackManager", packManagerProxy, {
    id: "PackManagerInstance",
  });

  const nftPoolArtifact = m.contractAt("NftPool", nftPoolProxy, {
    id: "NftPoolInstance",
  });

  // ============================================
  // 1. Grant BURNER_ROLE to PackManager on RariPack
  // ============================================
  const grantBurnerRole = m.call(rariPackArtifact, "grantRole", [BURNER_ROLE, packManagerProxy], {
    id: "GrantBurnerRoleToPackManager",
  });

  // ============================================
  // 2. Grant POOL_MANAGER_ROLE to PackManager on NftPool
  // ============================================
  const grantPoolManagerRole = m.call(nftPoolArtifact, "grantRole", [POOL_MANAGER_ROLE, packManagerProxy], {
    id: "GrantPoolManagerRoleToPackManager",
  });

  // ============================================
  // 3. Set NftPool in PackManager
  // ============================================
  const setNftPool = m.call(packManagerArtifact, "setNftPool", [nftPoolProxy], {
    id: "SetNftPool",
    after: [grantPoolManagerRole],
  });

  // ============================================
  // 4. Configure VRF on PackManager
  // ============================================
  const setVrfConfig = m.call(
    packManagerArtifact,
    "setVrfConfig",
    [vrfCoordinator, vrfSubscriptionId, vrfKeyHash, vrfCallbackGasLimit, vrfRequestConfirmations],
    {
      id: "SetVrfConfig",
    },
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

  const setPlatinumPrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Platinum, platinumPrice], {
    id: "SetPlatinumPrice",
  });

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

  // ============================================
  // 7. Set pack descriptions on RariPack (if provided)
  // ============================================
  const setBronzeDescription = m.call(rariPackArtifact, "setPackDescription", [PackType.Bronze, bronzeDescription], {
    id: "SetBronzeDescription",
  });

  const setSilverDescription = m.call(rariPackArtifact, "setPackDescription", [PackType.Silver, silverDescription], {
    id: "SetSilverDescription",
  });

  const setGoldDescription = m.call(rariPackArtifact, "setPackDescription", [PackType.Gold, goldDescription], {
    id: "SetGoldDescription",
  });

  const setPlatinumDescription = m.call(
    rariPackArtifact,
    "setPackDescription",
    [PackType.Platinum, platinumDescription],
    {
      id: "SetPlatinumDescription",
    },
  );

  // ============================================
  // 8. Enable instant cash (optional)
  // ============================================
  const setInstantCashEnabled = m.call(packManagerArtifact, "setInstantCashEnabled", [enableInstantCash], {
    id: "SetInstantCashEnabled",
  });

  return {
    // Role grants
    grantBurnerRole,
    grantPoolManagerRole,
    // PackManager config
    setNftPool,
    setVrfConfig,
    setInstantCashEnabled,
    // RariPack config
    setBronzePrice,
    setSilverPrice,
    setGoldPrice,
    setPlatinumPrice,
    setBronzeUri,
    setSilverUri,
    setGoldUri,
    setPlatinumUri,
    setBronzeDescription,
    setSilverDescription,
    setGoldDescription,
    setPlatinumDescription,
  };
});

export default SetupPackInfrastructureModule;
