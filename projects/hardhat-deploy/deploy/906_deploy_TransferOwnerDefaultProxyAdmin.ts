import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getOwner } from './utils';
import { Ownable } from '../typechain-types';


async function getDefaultProxyAdmin(hre: HardhatRuntimeEnvironment): Promise<Ownable> {
  const contractName = "DefaultProxyAdmin";
  const address = (await hre.deployments.get(contractName)).address;
  return (await hre.ethers.getContractAt(contractName, address)) as Ownable
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const owner  = await getOwner(hre);
  console.log("deploying contracts with the account:", deployer);

  const defaultProxyAdmin = await getDefaultProxyAdmin(hre);
  console.log("defaultProxyAdmin owner:", defaultProxyAdmin.owner);

};
export default func;
func.tags = ['all', 'transfer-owner-admin', "906"];