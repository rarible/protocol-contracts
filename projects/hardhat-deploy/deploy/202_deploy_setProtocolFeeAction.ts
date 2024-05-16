import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  let contractName: string = "";
  //deploying ExchangeV2 with meta support if needed
  if (!!deploy_meta) {
    contractName = "ExchangeMetaV2";
  }

  if (!!deploy_non_meta) {
    contractName = "ExchangeV2";
  }

  const exchangeV2Address = (await hre.deployments.get(contractName)).address
  console.log(`using exchangeV2: ${exchangeV2Address}`)

  //deploy ProxyUpgradeAction contract
  await deploy("SetProtocolFeeAction", {
    from: deployer,
    log: true,
    autoMine: true,
    args: [exchangeV2Address],
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
  });

};

export default func;
func.tags = ['SetProtocolFeeAction'];
