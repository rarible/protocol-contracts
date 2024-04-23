import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getOwner } from './utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const owner  = await getOwner(hre);
  console.log("deploying contracts with the account:", deployer);

  await deploy('RoyaltiesRegistry', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__RoyaltiesRegistry_init_proxy",
          args: [owner],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });

};
export default func;
func.tags = ['all', 'all-no-tokens', 'deploy-rr'];
