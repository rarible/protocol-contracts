import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);
  
  await deploy('DefaultProxyAdmin', {
    from: deployer,
    log: true,
    autoMine: true,
    gasLimit: 100000000,
    gasPrice: "0x2FAF0800",
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    args: [deployer],
    
  });

  await deploy('RoyaltiesRegistry', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__RoyaltiesRegistry_init",
          args: [],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
    gasLimit: 100000000,
    gasPrice: "0x2FAF0800",
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  });

};
export default func;
func.tags = ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-rr', '001'];
