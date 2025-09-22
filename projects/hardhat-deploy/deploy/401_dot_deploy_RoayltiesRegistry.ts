import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { DEPLOY_FROM } from '../utils/utils';
import {RoyaltiesRegistry, RoyaltiesRegistry__factory} from "../typechain-types-dot";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Deploying contracts on network ${hre.network.name}`);

  const { deploy, execute, getSigner } = hre.deployments;
  let { deployer } = await hre.getNamedAccounts();
  const signer = await getSigner(deployer);
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
  
  console.log("Initializing RoyaltiesRegistry", deployment.address);
  const RoyaltiesRegistry = await hre.ethers.getContractFactory("RoyaltiesRegistry", signer);
  const royaltiesRegistry =  RoyaltiesRegistry.attach(deployment.address);
  const receit = await royaltiesRegistry.__RoyaltiesRegistry_init();

  console.log("RoyaltiesRegistry deployed and initialized", (await receit.wait()).transactionHash);
};

export default func;
func.tags = ['all-dot', 'all-dot-no-tokens', "401"];
