import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getConfig } from "../utils/utils";
import { getOwner } from "./utils";
import { getWrapperSettings, zeroAddress } from "./exchangeWrapperSettings";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const owner = await getOwner(hre);

  let exchangeV2;
  if (!!deploy_meta) {
    exchangeV2 = (await hre.deployments.get("ExchangeMetaV2")).address;
  }

  if (!!deploy_non_meta) {
    exchangeV2 = (await hre.deployments.get("ExchangeV2")).address;
  }

  let settings = getWrapperSettings(hre.network.name);
  settings.marketplaces[1] = exchangeV2;

  if (settings.weth === zeroAddress) {
    console.log(`using zero address WETH for exchangeWrapper`);
  }

  const erc20TransferProxy = await hre.deployments.get("ERC20TransferProxy");
  settings.transferProxies.push(erc20TransferProxy.address);

  const deployment = await deploy("RaribleExchangeWrapperUpgradeable", {
    from: deployer,
    log: true,
    autoMine: true,
    args: [settings.marketplaces, settings.weth],
    proxy: {
      execute: {
        init: {
          methodName: "__ExchangeWrapper_init_proxy",
          args: [settings.transferProxies, owner],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
      owner: owner,
    },
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true : false,
  });
};

export default func;
func.tags = [
  "all",
  "all-zk",
  "wrapper",
  "all-no-tokens",
  "all-zk-no-tokens",
  "906",
];
