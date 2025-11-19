import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, execute } = hre.deployments;
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

  console.log("Deploying ExchangeV2 contract")
  // deploy ExchangeV2 and initialise contract
  await deploy(contractName, {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
    //gasPrice: "100000000000", // 100 gwei
    gasLimit: 4000000,
  });

  const proxyAdmin = await hre.deployments.get("DefaultProxyAdmin");
  const proxyAdminContract = await hre.ethers.getContractAt("hardhat-deploy-immutable-proxy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin", proxyAdmin.address);
  
  const exchangeV2ProxyAddress = (await hre.deployments.get(contractName + "_Proxy")).address;
  const exchangeV2ImplementationAddress =  (await hre.deployments.get(contractName + "_Implementation")).address;
  if( (await proxyAdminContract.getProxyImplementation(exchangeV2ProxyAddress)) !== exchangeV2ImplementationAddress) {
    console.log("ExchangeV2 implementation is not the same as the implementation address, upgrading...");
    await execute(
      "DefaultProxyAdmin",
      { from: deployer, log: true },
      "upgrade",
      exchangeV2ProxyAddress, 
      exchangeV2ImplementationAddress
    );
    await proxyAdminContract.upgrade(exchangeV2ProxyAddress, exchangeV2ImplementationAddress);
    console.log("Upgraded ExchangeV2 implementation to: ", exchangeV2ImplementationAddress);
  } else {
    console.log("ExchangeV2 implementation is the same as the implementation address, no upgrade needed");
  }

};

export default func;
func.tags = ['update-exchange', '101'];
