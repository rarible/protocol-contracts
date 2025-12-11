// Hardhat Ignition module for deploying PackManager with OpenZeppelin TransparentUpgradeableProxy
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PackManagerModule = buildModule("PackManagerModule", (m) => {
  // Get parameters
  const owner = m.getParameter<string>("owner");
  const rariPackProxy = m.getParameter<string>("rariPackProxy");

  // Deploy PackManager implementation
  const packManagerImpl = m.contract("PackManager", [], {
    id: "PackManagerImplementation",
  });

  // Encode initialization call
  const initData = m.encodeFunctionCall(packManagerImpl, "initialize", [owner, rariPackProxy]);

  // Deploy TransparentUpgradeableProxy
  const packManagerProxy = m.contract("TransparentUpgradeableProxy", [packManagerImpl, owner, initData], {
    id: "PackManagerProxy",
  });

  return {
    packManagerImpl,
    packManagerProxy,
  };
});

export default PackManagerModule;
