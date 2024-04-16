import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC721LazyMintTransferProxy
  const ERC721LazyMintTransferProxy = await hre.ethers.getContractFactory("ERC721LazyMintTransferProxy");
  const dtxTransferProxy = await ERC721LazyMintTransferProxy.getDeployTransaction();
  //console.log("4.1.! bytecode for erc721LazyMintTransferProxy:",dtxTransferProxy)
  var fs = require('fs');
  fs.writeFileSync('./ERC721LazyMintTransferProxy.txt', dtxTransferProxy.data , 'utf-8');
  
  //predict address
  const salt = getSalt();
  const expectedAddressTransferProxy = await factory.getDeploymentAddress(dtxTransferProxy.data, salt)
  const erc721LazyMintTransferProxy = await hre.ethers.getContractAt('ERC721LazyMintTransferProxy', expectedAddressTransferProxy);
  console.log("6.2.! Predict address for erc721LazyMintTransferProxy: ", expectedAddressTransferProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("6.3.! transfer ownership calldata for erc721LazyMintTransferProxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const initCalldata = (await erc721LazyMintTransferProxy.populateTransaction.__OperatorRole_init()).data;
  console.log("6.4.! init calldata for erc721LazyMintTransferProxy: ", initCalldata)

  //deploy erc721LazyMintTransferProxy
  //await(await factory.create(0, salt, dtxTransferProxy.data, expectedAddressTransferProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check rrProxy
  //console.log("erc721LazyMintTransferProxy owner:", await erc721LazyMintTransferProxy.owner())

  //save artifact
  await hre.deployments.save("ERC721LazyMintTransferProxy", {
    address: expectedAddressTransferProxy,
    ...(await hre.deployments.getExtendedArtifact("ERC721LazyMintTransferProxy"))
  })

};
export default func;
func.tags = ['oasys', "now"];
