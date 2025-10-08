import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig, ROYALTIES_REGISTRY_TYPE } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, execute } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);
  const royaltiesRegistry = (await hre.deployments.get(ROYALTIES_REGISTRY_TYPE)).address;

  let contractName: string = "";
  //deploying ExchangeV2 with meta support if needed
  if (!!deploy_meta) {
    contractName = "ExchangeMetaV2";
  }

  if (!!deploy_non_meta) {
    contractName = "ExchangeV2";
  }

  await execute(
    contractName,
    { from: deployer, log: true },
    "setRoyaltiesRegistry",
    royaltiesRegistry
  );
  
  //deploying new exchangeV2 impl
  console.log("deploying new exchangeV2 impl...")
};

export default func;
func.tags = ['203','set-royalties-registry'];
