import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import "@matterlabs/hardhat-zksync-ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Deploying contracts on network ${hre.network.name}`);

  const { deploy } = hre.deployments;
  const { zksyncEthers } = hre;
  const { deployer } = await hre.getNamedAccounts();

  console.log("Deploying contracts with the account:", deployer);

  // Deploy the contract without a proxy
  const deployment = await deploy('RoyaltiesRegistry', {
    from: deployer,
    log: true,
    autoMine: true,
  });
  
  // Get a contract instance
  const royaltiesRegistry = await zksyncEthers.getContractAt('RoyaltiesRegistry', deployment.address);

  // Call the __RoyaltiesRegistry_init function
  console.log("Initializing RoyaltiesRegistry");
  await (await royaltiesRegistry.__RoyaltiesRegistry_init()).wait();

  console.log("RoyaltiesRegistry deployed and initialized");
};

export default func;
func.tags = ['all-zk', 'all-zk-no-tokens', "301"];
