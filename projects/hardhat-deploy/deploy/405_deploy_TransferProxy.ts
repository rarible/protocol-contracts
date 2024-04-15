import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create TransferProxy
  const TransferProxy = await hre.ethers.getContractFactory("TransferProxy");
  const dtxTransferProxy = await TransferProxy.getDeployTransaction();
  //console.log("4.1.! bytecode for transferProxy:",dtxTransferProxy)

  //predict address
  const salt = hre.ethers.constants.HashZero;
  const expectedAddressTransferProxy = await factory.getDeploymentAddress(dtxTransferProxy.data, salt)
  const transferProxy = await hre.ethers.getContractAt('TransferProxy', expectedAddressTransferProxy);
  console.log("4.2.! Predict address for transferProxy: ", expectedAddressTransferProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("4.3.! transfer ownership calldata for transferProxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const initCalldata = (await transferProxy.populateTransaction.__OperatorRole_init()).data;
  console.log("4.4.! init calldata for transferProxy: ", initCalldata)

  //deploy transferProxy
  await(await factory.create(0, salt, dtxTransferProxy.data, expectedAddressTransferProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check rrProxy
  console.log("transferProxy owner:", await transferProxy.owner())

  //save artifact
  await hre.deployments.save("TransferProxy", {
    address: expectedAddressTransferProxy,
    ...(await hre.deployments.getExtendedArtifact("TransferProxy"))
  })

};
export default func;
func.tags = ['oasys'];
