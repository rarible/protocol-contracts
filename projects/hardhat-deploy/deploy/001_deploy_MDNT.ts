import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const { ethers } = hre;

  console.log("deploying contracts with the account:", deployer);

  const deployment = await deploy('MDNT', {
    from: deployer,
    log: true,
    autoMine: true,
  });

  const mdnt = await ethers.getContractAt('MDNT', deployment.address);

  await mdnt.initialize(
    "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4", //0x98556b192f8304001986e0BB94E61e51049A600c
    "Midnight in Tokyo",
    "MDNT",
    "ipfs://QmcFvCsrbhgHHeux9SeQWFdCMU1CF4Xhq9HKYF9VmtY5ie/0",
    [],
    "0x0f22f838AAcA272AFb0F268e4f4E655fAc3a35ec",
    "0x0f22f838AAcA272AFb0F268e4f4E655fAc3a35ec",
    1000,
    0,
    "0x0f22f838AAcA272AFb0F268e4f4E655fAc3a35ec"
  )
  console.log("done")

};
export default func;
func.tags = ['all'];
