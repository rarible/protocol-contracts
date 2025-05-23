import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { DEPLOY_FROM } from '../utils/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Deploying contracts on network ${hre.network.name}`);

  const { deploy, execute } = hre.deployments;
  let { deployer } = await hre.getNamedAccounts();

  // hardware wallet support
  if(deployer === undefined) {
    deployer = DEPLOY_FROM!;
  }

  console.log("Deploying contracts with the account:", deployer);

  // Deploy the contract without a proxy
  const deployment = await deploy('RoyaltiesRegistry', {
    from: deployer,
    log: true,
    autoMine: true,
  });
  
  console.log("Initializing RoyaltiesRegistry");
  // Get a contract instance
  const receit = await execute(
    "RoyaltiesRegistry",
    { from: deployer, log: true },
    "__RoyaltiesRegistry_init"               // pass init args here if any
  );

  console.log("RoyaltiesRegistry deployed and initialized", receit.status);
};

export default func;
func.tags = ['all-zk', 'all-zk-no-tokens', "301"];
