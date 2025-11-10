import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ExchangeV2__factory, ExchangeV2 } from '../typechain-types';

import { getConfig, ROYALTIES_REGISTRY_TYPE } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { execute, deploy } = hre.deployments;
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  let contractName: string = "";
  //deploying ExchangeV2 with meta support if needed
  if (!!deploy_meta) {
    contractName = "ExchangeMetaV2";
  }

  if (!!deploy_non_meta) {
    contractName = "ExchangeV2";
  }
  
  //deploying new exchangeV2 impl
  console.log("deploying new exchangeV2 impl...")
  const exchangeV2Receipt = await deploy(contractName, {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("deployed new exchangeV2 impl to: ", exchangeV2Receipt.address);

  //saving artifacts for the new exchangeV2 impl
  const {save, getExtendedArtifact } = hre.deployments;
  await save(contractName + "_Implementation", {
    address: exchangeV2Receipt.address,
    ...(await getExtendedArtifact(contractName))
  })
  console.log("saved artifacts for new exchangeV2 impl")

  const transferProxyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc20TransferProxyAddress = (await hre.deployments.get("ERC20TransferProxy")).address;
  const royaltiesRegistryAddress = (await hre.deployments.get(ROYALTIES_REGISTRY_TYPE)).address;

  await execute(
    contractName + "_Implementation",
    { from: deployer, log: true },
    "__ExchangeV2_init",
    transferProxyAddress,
    erc20TransferProxyAddress,
    0,
    "0xb6ec1d227d5486d344705663f700d90d947d7548",
    royaltiesRegistryAddress
  );
  console.log("initialised new exchangeV2 impl")
};

export default func;
func.tags = ['deploy-exchangeV2-implementation', '204'];
