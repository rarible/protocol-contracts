import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC721RaribleMinimalBeacon
  const ContractFactory = await hre.ethers.getContractFactory("ERC721RaribleMinimalBeacon");
  const erc721Impl = (await hre.deployments.get("ERC721RaribleMinimal_Implementation")).address;
  const dtx = await ContractFactory.getDeployTransaction(erc721Impl);
  //console.dir(dtx, {depth:null})
  var fs = require('fs');
  fs.writeFileSync('./ERC721RaribleMinimalBeacon.txt', dtx.data , 'utf-8');


  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let contract = await hre.ethers.getContractAt('ERC721RaribleMinimalBeacon', expectedAddress);
  console.log("9.2.! Predict address for erc721Beacon: ", expectedAddress)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("9.3.! transfer ownership calldata for erc721Beacon: ", ownershipCalldata)

  //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [ownershipCalldata])).wait()
  
  //check erc721Beacon
  //console.log("erc721Beacon owner:", await contract.owner())

  //save artifact
  await hre.deployments.save("ERC721RaribleMinimalBeacon", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("ERC721RaribleMinimalBeacon"))
  })

};
export default func;
func.tags = ['oasys', "now"];
