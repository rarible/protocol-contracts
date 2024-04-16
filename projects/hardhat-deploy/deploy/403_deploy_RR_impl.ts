import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(``)

  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create RoyaltiesRegistry
  const RoyaltiesRegistry = await hre.ethers.getContractFactory("RoyaltiesRegistry");
  const dtxRoyaltiesRegistry = await RoyaltiesRegistry.getDeployTransaction()
  //console.log("2.1.! bytecode for RoyaltiesRegistry impl:",dtxRoyaltiesRegistry)
  var fs = require('fs');
  fs.writeFileSync('./RoyaltiesRegistry_Implementation.txt', dtxRoyaltiesRegistry.data , 'utf-8');
  
  //predict address
  const salt = getSalt();
  const expectedAddressRoyaltiesRegistry = await factory.getDeploymentAddress(dtxRoyaltiesRegistry.data, salt)
  const royaltiesRegistry = await hre.ethers.getContractAt('RoyaltiesRegistry', expectedAddressRoyaltiesRegistry);
  console.log("2.2.! Predict address for RoyaltiesRegistry impl: ", expectedAddressRoyaltiesRegistry)

  //prepare calldata to transferOwnership
  console.log("2.3.! transfer ownership calldata for RoyaltiesRegistry impl: no calldata")

  //deploy RoyaltiesRegistry
  //await (await factory.create(0, salt, dtxRoyaltiesRegistry.data, expectedAddressRoyaltiesRegistry, "", [])).wait()

  //check RoyaltiesRegistry
  //console.log("RoyaltiesRegistry impl owner:", await royaltiesRegistry.owner())
  await hre.deployments.save("RoyaltiesRegistry_Implementation", {
    address: expectedAddressRoyaltiesRegistry,
    ...(await hre.deployments.getExtendedArtifact("RoyaltiesRegistry"))
  })
  
};
export default func;
func.tags = ['oasys', 'now'];
