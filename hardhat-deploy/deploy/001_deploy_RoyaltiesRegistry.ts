import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  
  console.log(`deploying RoyaltiesRegistry on network ${hre.network.name}`)

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const RoyaltiesRegistry = await hre.ethers.getContractFactory("RoyaltiesRegistry");
  
  const rr = await hre.upgrades.deployProxy(RoyaltiesRegistry, []);
  console.log(rr)
  await rr.waitForDeployment();
  console.log(rr)
  console.log("rr address:", await rr.getAddress());
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
func.tags = ['RoyaltiesRegistry'];
