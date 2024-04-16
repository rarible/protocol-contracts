import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC1155RaribleBeacon
  const ContractFactory = await hre.ethers.getContractFactory("ERC1155RaribleBeacon");
  const erc1155Impl = (await hre.deployments.get("ERC1155Rarible_Implementation")).address;
  const dtx = await ContractFactory.getDeployTransaction(erc1155Impl);
  //console.dir(dtx, {depth:null})
  var fs = require('fs');
  fs.writeFileSync('./ERC1155RaribleBeacon.txt', dtx.data , 'utf-8');


  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let contract = await hre.ethers.getContractAt('ERC1155RaribleBeacon', expectedAddress);
  console.log("9.2.! Predict address for erc1155Beacon: ", expectedAddress)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("9.3.! transfer ownership calldata for erc1155Beacon: ", ownershipCalldata)

  //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [ownershipCalldata])).wait()
  
  //check erc1155Beacon
  //console.log("erc1155Beacon owner:", await contract.owner())

  //save artifact
  await hre.deployments.save("ERC1155RaribleBeacon", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("ERC1155RaribleBeacon"))
  })

};
export default func;
func.tags = ['oasys', "now"];
