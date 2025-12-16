// Hardhat Ignition module for upgrading NftPool proxy
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UpgradeNftPoolModule = buildModule("UpgradeNftPoolModule", (m) => {
  const proxyAdminAddress = m.getParameter<string>("proxyAdminAddress");
  const proxyAddress = m.getParameter<string>("proxyAddress");

  // Deploy new implementation
  const newImpl = m.contract("NftPool", [], {
    id: "NftPoolNewImplementation",
  });

  // Get ProxyAdmin contract instance
  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress, {
    id: "NftPoolProxyAdmin",
  });

  // Upgrade the proxy
  m.call(proxyAdmin, "upgradeAndCall", [proxyAddress, newImpl, "0x"], {
    id: "UpgradeNftPool",
    after: [newImpl],
  });

  return { newImpl };
});

export default UpgradeNftPoolModule;
