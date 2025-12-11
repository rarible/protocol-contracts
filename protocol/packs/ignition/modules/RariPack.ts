// Hardhat Ignition module for deploying RariPack with OpenZeppelin TransparentUpgradeableProxy
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RariPackModule = buildModule("RariPackModule", (m) => {
  // Get parameters
  const owner = m.getParameter<string>("owner");
  const treasury = m.getParameter<string>("treasury");
  const name = m.getParameter<string>("name", "Rari Pack");
  const symbol = m.getParameter<string>("symbol", "RPACK");

  // Deploy RariPack implementation
  const rariPackImpl = m.contract("RariPack", [], {
    id: "RariPackImplementation",
  });

  // Encode initialization call
  const initData = m.encodeFunctionCall(rariPackImpl, "initialize", [
    owner,
    treasury,
    name,
    symbol,
  ]);

  // Deploy TransparentUpgradeableProxy
  const rariPackProxy = m.contract(
    "TransparentUpgradeableProxy",
    [rariPackImpl, owner, initData],
    {
      id: "RariPackProxy",
    }
  );

  return {
    rariPackImpl,
    rariPackProxy,
  };
});

export default RariPackModule;

