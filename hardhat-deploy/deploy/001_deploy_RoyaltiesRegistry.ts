import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { RoyaltiesRegistry, RoyaltiesRegistry__factory } from "../typechain-types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  
  console.log(`deploying RoyaltiesRegistry on network ${hre.network.name}`)

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  //const RoyaltiesRegistry  = new RoyaltiesRegistry__factory(deployer)
  const RoyaltiesRegistry = await hre.ethers.getContractFactory("RoyaltiesRegistry") as RoyaltiesRegistry__factory;
  
  const rr = await hre.upgrades.deployProxy(RoyaltiesRegistry, []) as RoyaltiesRegistry;
  console.log(rr)
  await rr.deployTransaction.wait(5)
  // await rr.waitForDeployment();
  // console.log(rr)
  console.log("rr address:", await rr.address);
  const royaltiesRegistry = RoyaltiesRegistry.attach(rr.address);
  
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
