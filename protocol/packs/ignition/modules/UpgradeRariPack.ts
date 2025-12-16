// Hardhat Ignition module for upgrading RariPack proxy
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UpgradeRariPackModule = buildModule("UpgradeRariPackModule", (m) => {
  const proxyAdminAddress = m.getParameter<string>("proxyAdminAddress");
  const proxyAddress = m.getParameter<string>("proxyAddress");

  // Deploy new implementation
  const newImpl = m.contract("RariPack", [], {
    id: "RariPackNewImplementation",
  });

  // Get ProxyAdmin contract instance
  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress, {
    id: "RariPackProxyAdmin",
  });

  // Upgrade the proxy (no initialization data needed for upgrade)
  m.call(proxyAdmin, "upgradeAndCall", [proxyAddress, newImpl, "0x"], {
    id: "UpgradeRariPack",
    after: [newImpl],
  });

  return { newImpl };
});

export default UpgradeRariPackModule;
