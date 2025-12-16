// Hardhat Ignition module for upgrading PackManager proxy
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UpgradePackManagerModule = buildModule("UpgradePackManagerModule", (m) => {
  const proxyAdminAddress = m.getParameter<string>("proxyAdminAddress");
  const proxyAddress = m.getParameter<string>("proxyAddress");

  // Deploy new implementation
  const newImpl = m.contract("PackManager", [], {
    id: "PackManagerNewImplementation",
  });

  // Get ProxyAdmin contract instance
  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress, {
    id: "PackManagerProxyAdmin",
  });

  // Upgrade the proxy
  m.call(proxyAdmin, "upgradeAndCall", [proxyAddress, newImpl, "0x"], {
    id: "UpgradePackManager",
    after: [newImpl],
  });

  return { newImpl };
});

export default UpgradePackManagerModule;
