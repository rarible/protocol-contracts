import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC1155Rarible
  const ContractFactory = await hre.ethers.getContractFactory("ERC1155Rarible");
  const dtx = await ContractFactory.getDeployTransaction();
  //console.dir(dtx, {depth:null})
  var fs = require('fs');
  fs.writeFileSync('./ERC1155Rarible_Implementation.txt', dtx.data , 'utf-8');

  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let contract = await hre.ethers.getContractAt('ERC1155Rarible', expectedAddress);
  console.log("7.2.! Predict address for erc1155: ", expectedAddress)
  
  /*
  //deploy erc1155
  if (hre.network.name === "hardhat") {
    contract = await ContractFactory.deploy();
    await contract.deployed();
    expectedAddress = contract.address;
  } else {
    //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [])).wait()
  }
  */

  //check rrProxy
  //console.log("erc1155 owner:", await contract.owner())

  //save artifact
  await hre.deployments.save("ERC1155Rarible_Implementation", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("ERC1155Rarible"))
  })

};
export default func;
func.tags = ['oasys', "now"];
