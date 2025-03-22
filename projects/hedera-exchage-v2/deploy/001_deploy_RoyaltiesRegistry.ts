import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);

  await deploy('HederaRoyaltiesRegistry', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__HederaRoyaltiesRegistry_init",
          args: [],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
  });

};
export default func;
func.tags = ['all', 'all-no-tokens', 'deploy-rr', '001'];
