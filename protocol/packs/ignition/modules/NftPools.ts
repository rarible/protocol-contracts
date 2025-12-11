// Hardhat Ignition module for deploying all NftPool contracts with OpenZeppelin TransparentUpgradeableProxy
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Pool types (ordered from common to rare for extensibility)
const PoolType = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  UltraRare: 4,
};

const NftPoolsModule = buildModule("NftPoolsModule", (m) => {
  // Get parameters
  const owner = m.getParameter<string>("owner");

  // ============================================
  // Deploy NftPool Implementation (shared)
  // ============================================
  const nftPoolImpl = m.contract("NftPool", [], {
    id: "NftPoolImplementation",
  });

  // ============================================
  // Deploy Common Pool
  // ============================================
  const commonPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, PoolType.Common]);

  const commonPool = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, commonPoolInitData], {
    id: "CommonPoolProxy",
  });

  // ============================================
  // Deploy Rare Pool
  // ============================================
  const rarePoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, PoolType.Rare]);

  const rarePool = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, rarePoolInitData], {
    id: "RarePoolProxy",
  });

  // ============================================
  // Deploy Epic Pool
  // ============================================
  const epicPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, PoolType.Epic]);

  const epicPool = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, epicPoolInitData], {
    id: "EpicPoolProxy",
  });

  // ============================================
  // Deploy Legendary Pool
  // ============================================
  const legendaryPoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, PoolType.Legendary]);

  const legendaryPool = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, legendaryPoolInitData], {
    id: "LegendaryPoolProxy",
  });

  // ============================================
  // Deploy UltraRare Pool
  // ============================================
  const ultraRarePoolInitData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, PoolType.UltraRare]);

  const ultraRarePool = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, ultraRarePoolInitData], {
    id: "UltraRarePoolProxy",
  });

  return {
    nftPoolImpl,
    commonPool,
    rarePool,
    epicPool,
    legendaryPool,
    ultraRarePool,
  };
});

export default NftPoolsModule;
