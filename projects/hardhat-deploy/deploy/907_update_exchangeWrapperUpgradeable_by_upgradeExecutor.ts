import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getWrapperSettings } from "./exchangeWrapperSettings";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, save, getExtendedArtifact } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  /* Get previously deployed ExchangeV2 */
  const exchangeV2 = await hre.deployments.get("ExchangeV2");

  let settings = getWrapperSettings(hre.network.name);
  settings.marketplaces[1] = exchangeV2.address;

  /* Get previously deployed ERC20TransferProxys */
  const erc20TransferProxy = await hre.deployments.get("ERC20TransferProxy");
  settings.transferProxies.push(erc20TransferProxy.address);

  /* Deploy new implementation of RaribleExchangeWrapperUpgradeable */
  console.log(
    "Deploying new RaribleExchangeWrapperUpgradeable implementation..."
  );
  const RaribleExchangeWrapperFactory = await hre.ethers.getContractFactory(
    "RaribleExchangeWrapperUpgradeable"
  );
  const newRaribleExchangeWrapper = await RaribleExchangeWrapperFactory.deploy(
    settings.marketplaces,
    settings.weth
  );
  await newRaribleExchangeWrapper.deployed();
  const newImplementationAddress = newRaribleExchangeWrapper.address;
  console.log(
    "Deployed new RaribleExchangeWrapperUpgradeable implementation to:",
    newImplementationAddress
  );

  // Save the new implementation's artifacts
  await save(`RaribleExchangeWrapperUpgradeable_Implementation`, {
    address: newImplementationAddress,
    ...(await getExtendedArtifact("RaribleExchangeWrapperUpgradeable")),
  });
  console.log(
    "Saved artifacts for new RaribleExchangeWrapperUpgradeable implementation"
  );

  // Deploy ProxyUpgradeAction contract
  const proxyUpgradeActionReceipt = await deploy("ProxyUpgradeAction", {
    from: deployer,
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
  });
  const ProxyUpgradeAction = await hre.ethers.getContractFactory(
    "ProxyUpgradeAction"
  );
  const proxyUpgradeAction = ProxyUpgradeAction.attach(
    proxyUpgradeActionReceipt.address
  );
  console.log(`Using ProxyUpgradeAction at ${proxyUpgradeAction.address}`);

  // Get existing UpgradeExecutor
  const upgradeExecutor = await hre.deployments.get("UpgradeExecutor");
  console.log(`Using UpgradeExecutor at ${upgradeExecutor.address}`);

  // Prepare calldata
  const adminAddress = (await hre.deployments.get("DefaultProxyAdmin")).address;
  console.log(`Using ProxyAdmin address: ${adminAddress}`);

  /* @dev @tbd ensure that this is picking the correct TransparentProxyAddress and not the implementation */
  const exchangeWrapperProxyAddress = (
    await hre.deployments.get("RaribleExchangeWrapperUpgradeable")
  ).address;
  console.log(
    `Using RaribleExchangeWrapperUpgradeable proxy: ${exchangeWrapperProxyAddress}`
  );

  const tx = await proxyUpgradeAction.populateTransaction.perform(
    adminAddress,
    exchangeWrapperProxyAddress,
    newImplementationAddress
  );
  console.log(`Address: ${proxyUpgradeAction.address}`);
  console.log(`Calldata: ${tx.data}`);
};

export default func;
func.tags = ["update-wrapper-by-upgradeExecutor", "907"];
