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
  // Sequential execution: each step waits for the previous one
  // ============================================

  // 1. Grant BURNER_ROLE to PackManager on RariPack
  const grantBurnerRole = m.call(rariPackArtifact, "grantRole", [BURNER_ROLE, packManagerProxy], {
    id: "GrantBurnerRoleToPackManager",
  });

  // 2. Grant POOL_MANAGER_ROLE to PackManager on NftPool
  const grantPoolManagerRole = m.call(nftPoolArtifact, "grantRole", [POOL_MANAGER_ROLE, packManagerProxy], {
    id: "GrantPoolManagerRoleToPackManager",
    after: [grantBurnerRole],
  });

  // 3. Set NftPool in PackManager
  const setNftPool = m.call(packManagerArtifact, "setNftPool", [nftPoolProxy], {
    id: "SetNftPool",
    after: [grantPoolManagerRole],
  });

  // 4. Configure VRF on PackManager
  const setVrfConfig = m.call(
    packManagerArtifact,
    "setVrfConfig",
    [vrfCoordinator, vrfSubscriptionId, vrfKeyHash, vrfCallbackGasLimit, vrfRequestConfirmations],
    {
      id: "SetVrfConfig",
      after: [setNftPool],
    },
  );

  // 5. Set pack prices on RariPack (sequential)
  const setBronzePrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Bronze, bronzePrice], {
    id: "SetBronzePrice",
    after: [setVrfConfig],
  });

  const setSilverPrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Silver, silverPrice], {
    id: "SetSilverPrice",
    after: [setBronzePrice],
  });

  const setGoldPrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Gold, goldPrice], {
    id: "SetGoldPrice",
    after: [setSilverPrice],
  });

  const setPlatinumPrice = m.call(rariPackArtifact, "setPackPrice", [PackType.Platinum, platinumPrice], {
    id: "SetPlatinumPrice",
    after: [setGoldPrice],
  });

  // 6. Set pack URIs on RariPack (sequential)
  const setBronzeUri = m.call(rariPackArtifact, "setPackURI", [PackType.Bronze, bronzeUri], {
    id: "SetBronzeUri",
    after: [setPlatinumPrice],
  });

  const setSilverUri = m.call(rariPackArtifact, "setPackURI", [PackType.Silver, silverUri], {
    id: "SetSilverUri",
    after: [setBronzeUri],
  });

  const setGoldUri = m.call(rariPackArtifact, "setPackURI", [PackType.Gold, goldUri], {
    id: "SetGoldUri",
    after: [setSilverUri],
  });

  const setPlatinumUri = m.call(rariPackArtifact, "setPackURI", [PackType.Platinum, platinumUri], {
    id: "SetPlatinumUri",
    after: [setGoldUri],
  });

  // 7. Set pack descriptions on RariPack (sequential)
  const setBronzeDescription = m.call(rariPackArtifact, "setPackDescription", [PackType.Bronze, bronzeDescription], {
    id: "SetBronzeDescription",
    after: [setPlatinumUri],
  });

  const setSilverDescription = m.call(rariPackArtifact, "setPackDescription", [PackType.Silver, silverDescription], {
    id: "SetSilverDescription",
    after: [setBronzeDescription],
  });

  const setGoldDescription = m.call(rariPackArtifact, "setPackDescription", [PackType.Gold, goldDescription], {
    id: "SetGoldDescription",
    after: [setSilverDescription],
  });

  const setPlatinumDescription = m.call(
    rariPackArtifact,
    "setPackDescription",
    [PackType.Platinum, platinumDescription],
    {
      id: "SetPlatinumDescription",
      after: [setGoldDescription],
    },
  );

  // 8. Enable instant cash (last step)
  const setInstantCashEnabled = m.call(packManagerArtifact, "setInstantCashEnabled", [enableInstantCash], {
    id: "SetInstantCashEnabled",
    after: [setPlatinumDescription],
  });

  return {
    // Return contract instances for reference
    rariPackArtifact,
    packManagerArtifact,
    nftPoolArtifact,
  };
});

export default SetupPackInfrastructureModule;
