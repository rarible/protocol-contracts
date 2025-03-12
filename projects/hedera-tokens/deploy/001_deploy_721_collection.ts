import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);

  const deployResult = await deploy('RariHedera721DropFactory', {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("RariHedera721DropFactory deployed to:", deployResult.address);


};
export default func;
func.tags = ['all', 'all-no-tokens', '001'];
