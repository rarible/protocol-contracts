// Hardhat Ignition module for deploying the complete Pack Infrastructure
// This module deploys RariPack, NftPool, and PackManager in sequence
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

const PackInfrastructureModule = buildModule("PackInfrastructureModule", (m) => {
  // ============================================
  // Parameters
  // ============================================
  const owner = m.getParameter<string>("owner");
  const treasury = m.getParameter<string>("treasury");
  const packName = m.getParameter<string>("packName", "Rari Pack");
  const packSymbol = m.getParameter<string>("packSymbol", "RPACK");

  // NftPool: use empty ranges array to use default price ranges
  // Or provide custom ranges as array of {lowPrice, highPrice}
  const useCustomPoolRanges = m.getParameter<boolean>("useCustomPoolRanges", false);
  const customPoolRanges = m.getParameter("customPoolRanges", []);

  // ============================================
  // 1. Deploy RariPack
  // ============================================
  const rariPackImpl = m.contract("RariPack", [], {
    id: "RariPackImplementation",
  });

  const rariPackInitData = m.encodeFunctionCall(rariPackImpl, "initialize", [owner, treasury, packName, packSymbol]);

  const rariPackProxy = m.contract("TransparentUpgradeableProxy", [rariPackImpl, owner, rariPackInitData], {
    id: "RariPackProxy",
  });

  // ============================================
  // 2. Deploy NftPool (single pool for all levels)
  // ============================================
  const nftPoolImpl = m.contract("NftPool", [], {
    id: "NftPoolImplementation",
  });

  // initialize(address initialOwner, PoolRange[] calldata ranges)
  // Empty array uses default ranges
  const poolRanges = useCustomPoolRanges ? customPoolRanges : [];
  const nftPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, poolRanges]);

  const nftPoolProxy = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, nftPoolInitData], {
    id: "NftPoolProxy",
  });

  // ============================================
  // 3. Deploy PackManager
  // ============================================
  const packManagerImpl = m.contract("PackManager", [], {
    id: "PackManagerImplementation",
  });

  const packManagerInitData = m.encodeFunctionCall(packManagerImpl, "initialize", [owner, rariPackProxy]);

  const packManagerProxy = m.contract("TransparentUpgradeableProxy", [packManagerImpl, owner, packManagerInitData], {
    id: "PackManagerProxy",
    after: [rariPackProxy],
  });

  return {
    // Implementations
    rariPackImpl,
    nftPoolImpl,
    packManagerImpl,
    // Proxies
    rariPackProxy,
    nftPoolProxy,
    packManagerProxy,
  };
});

export default PackInfrastructureModule;
