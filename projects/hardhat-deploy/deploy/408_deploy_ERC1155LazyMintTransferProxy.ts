import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC1155LazyMintTransferProxy
  const ERC1155LazyMintTransferProxy = await hre.ethers.getContractFactory("ERC1155LazyMintTransferProxy");
  const dtxTransferProxy = await ERC1155LazyMintTransferProxy.getDeployTransaction();
  //console.log("4.1.! bytecode for erc1155LazyMintTransferProxy:",dtxTransferProxy)

  //predict address
  const salt = hre.ethers.constants.HashZero;
  const expectedAddressTransferProxy = await factory.getDeploymentAddress(dtxTransferProxy.data, salt)
  const erc1155LazyMintTransferProxy = await hre.ethers.getContractAt('ERC1155LazyMintTransferProxy', expectedAddressTransferProxy);
  console.log("7.2.! Predict address for erc1155LazyMintTransferProxy: ", expectedAddressTransferProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("7.3.! transfer ownership calldata for erc1155LazyMintTransferProxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const initCalldata = (await erc1155LazyMintTransferProxy.populateTransaction.__OperatorRole_init()).data;
  console.log("7.4.! init calldata for erc1155LazyMintTransferProxy: ", initCalldata)

  //deploy erc1155LazyMintTransferProxy
  await (await factory.create(0, salt, dtxTransferProxy.data, expectedAddressTransferProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check rrProxy
  console.log("erc1155LazyMintTransferProxy owner:", await erc1155LazyMintTransferProxy.owner())

  //save artifact
  await hre.deployments.save("ERC1155LazyMintTransferProxy", {
    address: expectedAddressTransferProxy,
    ...(await hre.deployments.getExtendedArtifact("ERC1155LazyMintTransferProxy"))
  })

};
export default func;
func.tags = ['oasys'];
