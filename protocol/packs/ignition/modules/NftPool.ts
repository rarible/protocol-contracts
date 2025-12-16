// Hardhat Ignition module for deploying NftPool with OpenZeppelin TransparentUpgradeableProxy
// NftPool is a single pool that manages all pool levels based on price ranges
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

// Default pool ranges (in wei)
// Common:    0 - 0.5 ETH
// Rare:      0.5 - 2 ETH
// Epic:      2 - 10 ETH
// Legendary: 10 - 50 ETH
// UltraRare: 50+ ETH
const DEFAULT_POOL_RANGES = [
  { lowPrice: BigInt(0), highPrice: ethers.parseEther("0.5") },
  { lowPrice: ethers.parseEther("0.5"), highPrice: ethers.parseEther("2") },
  { lowPrice: ethers.parseEther("2"), highPrice: ethers.parseEther("10") },
  { lowPrice: ethers.parseEther("10"), highPrice: ethers.parseEther("50") },
  { lowPrice: ethers.parseEther("50"), highPrice: ethers.MaxUint256 },
];

const NftPoolModule = buildModule("NftPoolModule", (m) => {
  // Get parameters
  const owner = m.getParameter<string>("owner");

  // Optional custom pool ranges (array of {lowPrice, highPrice})
  // If not provided, uses default ranges
  const useCustomRanges = m.getParameter<boolean>("useCustomRanges", false);
  const customRanges = m.getParameter("customRanges", DEFAULT_POOL_RANGES);

  // Deploy NftPool implementation
  const nftPoolImpl = m.contract("NftPool", [], {
    id: "NftPoolImplementation",
  });

  // Encode initialization call
  // initialize(address initialOwner, PoolRange[] calldata ranges)
  // Pass empty array [] to use default ranges, or custom ranges array
  const ranges = useCustomRanges ? customRanges : [];
  const initData = m.encodeFunctionCall(nftPoolImpl, "initialize", [owner, ranges]);

  // Deploy TransparentUpgradeableProxy
  const nftPoolProxy = m.contract("TransparentUpgradeableProxy", [nftPoolImpl, owner, initData], {
    id: "NftPoolProxy",
  });

  return {
    nftPoolImpl,
    nftPoolProxy,
  };
});

export default NftPoolModule;
