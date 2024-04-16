import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC721RaribleMinimal
  const ContractFactory = await hre.ethers.getContractFactory("ERC721RaribleMinimal");
  const dtx = await ContractFactory.getDeployTransaction();
  //console.dir(dtx, {depth:null})
  var fs = require('fs');
  fs.writeFileSync('./ERC721RaribleMinimal_Implementation.txt', dtx.data , 'utf-8');

  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let contract = await hre.ethers.getContractAt('ERC721RaribleMinimal', expectedAddress);
  console.log("7.2.! Predict address for erc721: ", expectedAddress)
  
  /*
  //deploy erc721
  if (hre.network.name === "hardhat") {
    contract = await ContractFactory.deploy();
    await contract.deployed();
    expectedAddress = contract.address;
  } else {
    //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [])).wait()
  }
  */

  //check rrProxy
  //console.log("erc721 owner:", await contract.owner())

  //save artifact
  await hre.deployments.save("ERC721RaribleMinimal_Implementation", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("ERC721RaribleMinimal"))
  })

};
export default func;
func.tags = ['oasys', "now"];
