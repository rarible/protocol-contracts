import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getWrapperSettings } from "../utils/exchangeWrapperSettings";
import { getConfig } from "../utils/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  let exchangeV2;
  if (!!deploy_meta) {
    exchangeV2 = (await hre.deployments.get("ExchangeMetaV2")).address;
  }

  if (!!deploy_non_meta) {
    exchangeV2 = (await hre.deployments.get("ExchangeV2")).address;
  }

  let settings = getWrapperSettings(hre.network.name);
  settings.marketplaces[1] = exchangeV2;

  const erc20TransferProxy = await hre.deployments.get("ERC20TransferProxy");
  settings.transferProxies.push(erc20TransferProxy.address);

  /* Deploy new implementation of RaribleExchangeWrapperUpgradeable */
  console.log(
    "Deploying new RaribleExchangeWrapperUpgradeable implementation..."
  );
  const RaribleExchangeWrapperFactory = await hre.ethers.getContractFactory(
    "RaribleExchangeWrapperUpgradeable"
  );
  const newRaribleExchangeWrapper =
    await RaribleExchangeWrapperFactory.deploy();
  await newRaribleExchangeWrapper.deployed();
  const newImplementationAddress = newRaribleExchangeWrapper.address;
  console.log(
    "Deployed new RaribleExchangeWrapperUpgradeable implementation to:",
    newImplementationAddress
  );

  /* Save the new implementation's artifacts */
  const { save, getExtendedArtifact } = hre.deployments;
  await save(`RaribleExchangeWrapperUpgradeable_Implementation`, {
    address: newImplementationAddress,
    ...(await getExtendedArtifact("RaribleExchangeWrapperUpgradeable")),
  });
  console.log(
    "Saved artifacts for new RaribleExchangeWrapperUpgradeable implementation"
  );

  /* Deploy ProxyUpgradeAction contract */
  const proxyUpgradeActionReceipt = await deploy("ProxyUpgradeAction", {
    from: deployer,
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true : false,
  });
  const ProxyUpgradeAction = await hre.ethers.getContractFactory(
    "ProxyUpgradeAction"
  );
  const proxyUpgradeAction = ProxyUpgradeAction.attach(
    proxyUpgradeActionReceipt.address
  );
  console.log(`Using ProxyUpgradeAction at ${proxyUpgradeAction.address}`);

  /* Get existing UpgradeExecutor */
  const UpgradeExecutor = await hre.ethers.getContractFactory(
    "UpgradeExecutor"
  );
  const upgradeExecutorAddress = (await hre.deployments.get("UpgradeExecutor"))
    .address;
  const upgradeExecutor = await UpgradeExecutor.attach(upgradeExecutorAddress);
  console.log(`using UpgradeExecutor at ${upgradeExecutor.address}`);

  /* Prepare calldata */
  const adminAddress = (await hre.deployments.get("DefaultProxyAdmin")).address;
  console.log(`Using ProxyAdmin address: ${adminAddress}`);

  /* @dev @TBD ensure that this is picking the correct TransparentProxyAddress 
  and not the implementation address from the hardhat deployed contracts */
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
