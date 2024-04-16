import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC721RaribleFactoryC2
  const ContractFactory = await hre.ethers.getContractFactory("ERC721RaribleFactoryC2");
  const erc721Beacon = (await hre.deployments.get("ERC721RaribleMinimalBeacon")).address;
  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc721LazyMintTransferProxyAddress = (await hre.deployments.get("ERC721LazyMintTransferProxy")).address;

  const dtx = await ContractFactory.getDeployTransaction(erc721Beacon, transferProxyyAddress, erc721LazyMintTransferProxyAddress);
  //console.dir(dtx, {depth:null})
  var fs = require('fs');
  fs.writeFileSync('./ERC721RaribleFactoryC2.txt', dtx.data , 'utf-8');

  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let contract = await hre.ethers.getContractAt('ERC721RaribleFactoryC2', expectedAddress);
  console.log("9.2.! Predict address for ERC721RaribleFactoryC2: ", expectedAddress)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("9.3.! transfer ownership calldata for ERC721RaribleFactoryC2: ", ownershipCalldata)

  //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [ownershipCalldata])).wait()
  
  //check ERC721RaribleFactoryC2
  //console.log("ERC721RaribleFactoryC2 owner:", await contract.owner())

  //save artifact
  await hre.deployments.save("ERC721RaribleFactoryC2", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("ERC721RaribleFactoryC2"))
  })

};
export default func;
func.tags = ['oasys', "now"];
