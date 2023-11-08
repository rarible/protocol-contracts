import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { RoyaltiesRegistry, RoyaltiesRegistry__factory } from "../typechain-types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  
  console.log(`deploying RoyaltiesRegistry on network ${hre.network.name}`)

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  //const RoyaltiesRegistry  = new RoyaltiesRegistry__factory(deployer)
  const RoyaltiesRegistry = await hre.ethers.getContractFactory("RoyaltiesRegistry") as RoyaltiesRegistry__factory;
  
  const royaltiesRegistry = await hre.upgrades.deployProxy(RoyaltiesRegistry, []) as RoyaltiesRegistry;

  // verify
  console.log("verify")
  console.log("RoyaltiesRegistry address:", await royaltiesRegistry.address);
  await royaltiesRegistry.deployTransaction.wait(20)
  
  await hre.run("verify:verify", {
      address: royaltiesRegistry.address,
      constructorArguments: [
      ],
  });
  console.log("verify done")
  
  /*const {getNamedAccounts} = hre;

  const { deployer } = await getNamedAccounts();

  const RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry");
  console.log("Deploying RoyaltiesRegistry...");
  const proxy = await upgrades.deployProxy(RoyaltiesRegistry, []);
  console.log(proxy)
  //await proxy.deployed();

  console.log("RoyaltiesRegistry deployed to:", proxy.address);
  */
};
export default func;
func.tags = ['all', 'RoyaltiesRegistry'];
