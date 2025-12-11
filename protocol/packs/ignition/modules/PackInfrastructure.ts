// Hardhat Ignition module for deploying the complete Pack Infrastructure
// This module deploys RariPack, all NftPools, and PackManager in sequence
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

const PackInfrastructureModule = buildModule("PackInfrastructureModule", (m) => {
  // ============================================
  // Parameters
  // ============================================
  const owner = m.getParameter<string>("owner");
  const treasury = m.getParameter<string>("treasury");
  const packName = m.getParameter<string>("packName", "Rari Pack");
  const packSymbol = m.getParameter<string>("packSymbol", "RPACK");

  // VRF Configuration (Chainlink VRF v2.5)
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

  // ============================================
  // 1. Deploy RariPack
  // ============================================
  const rariPackImpl = m.contract("RariPack", [], {
    id: "RariPackImplementation",
  });

  const rariPackInitData = m.encodeFunctionCall(rariPackImpl, "initialize", [
    owner,
    treasury,
    packName,
    packSymbol,
  ]);

  const rariPackProxy = m.contract(
    "TransparentUpgradeableProxy",
    [rariPackImpl, owner, rariPackInitData],
    {
      id: "RariPackProxy",
    }
  );

  // ============================================
  // 2. Deploy NftPool Implementation (shared)
  // ============================================
  const nftPoolImpl = m.contract("NftPool", [], {
    id: "NftPoolImplementation",
  });

  // ============================================
  // 3. Deploy All NFT Pools
  // ============================================

  // Common Pool
  const commonPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [
    owner,
    PoolType.Common,
  ]);
  const commonPool = m.contract(
    "TransparentUpgradeableProxy",
    [nftPoolImpl, owner, commonPoolInitData],
    { id: "CommonPoolProxy" }
  );

  // Rare Pool
  const rarePoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [
    owner,
    PoolType.Rare,
  ]);
  const rarePool = m.contract(
    "TransparentUpgradeableProxy",
    [nftPoolImpl, owner, rarePoolInitData],
    { id: "RarePoolProxy" }
  );

  // Epic Pool
  const epicPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [
    owner,
    PoolType.Epic,
  ]);
  const epicPool = m.contract(
    "TransparentUpgradeableProxy",
    [nftPoolImpl, owner, epicPoolInitData],
    { id: "EpicPoolProxy" }
  );

  // Legendary Pool
  const legendaryPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [
    owner,
    PoolType.Legendary,
  ]);
  const legendaryPool = m.contract(
    "TransparentUpgradeableProxy",
    [nftPoolImpl, owner, legendaryPoolInitData],
    { id: "LegendaryPoolProxy" }
  );

  // UltraRare Pool
  const ultraRarePoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [
    owner,
    PoolType.UltraRare,
  ]);
  const ultraRarePool = m.contract(
    "TransparentUpgradeableProxy",
    [nftPoolImpl, owner, ultraRarePoolInitData],
    { id: "UltraRarePoolProxy" }
  );

  // ============================================
  // 4. Deploy PackManager
  // ============================================
  const packManagerImpl = m.contract("PackManager", [], {
    id: "PackManagerImplementation",
  });

  const packManagerInitData = m.encodeFunctionCall(packManagerImpl, "initialize", [
    owner,
    rariPackProxy,
  ]);

  const packManagerProxy = m.contract(
    "TransparentUpgradeableProxy",
    [packManagerImpl, owner, packManagerInitData],
    {
      id: "PackManagerProxy",
      after: [rariPackProxy],
    }
  );

  return {
    // Implementations
    rariPackImpl,
    nftPoolImpl,
    packManagerImpl,
    // Proxies
    rariPackProxy,
    commonPool,
    rarePool,
    epicPool,
    legendaryPool,
    ultraRarePool,
    packManagerProxy,
  };
});

export default PackInfrastructureModule;

