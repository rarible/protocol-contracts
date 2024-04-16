import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ERC20TransferProxy
  const ERC20TransferProxy = await hre.ethers.getContractFactory("ERC20TransferProxy");
  const dtxTransferProxy = await ERC20TransferProxy.getDeployTransaction();
  //console.log("4.1.! bytecode for erc20TransferProxy:",dtxTransferProxy)
  var fs = require('fs');
  fs.writeFileSync('./ERC20TransferProxy.txt', dtxTransferProxy.data , 'utf-8');
  
  //predict address
  const salt = getSalt();
  const expectedAddressTransferProxy = await factory.getDeploymentAddress(dtxTransferProxy.data, salt)
  const erc20TransferProxy = await hre.ethers.getContractAt('ERC20TransferProxy', expectedAddressTransferProxy);
  console.log("5.2.! Predict address for erc20TransferProxy: ", expectedAddressTransferProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("5.3.! transfer ownership calldata for erc20TransferProxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const initCalldata = (await erc20TransferProxy.populateTransaction.__OperatorRole_init()).data;
  console.log("5.4.! init calldata for erc20TransferProxy: ", initCalldata)

  //deploy erc20TransferProxy
  //await(await factory.create(0, salt, dtxTransferProxy.data, expectedAddressTransferProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check rrProxy
  //console.log("erc20TransferProxy owner:", await erc20TransferProxy.owner())

  //save artifact
  await hre.deployments.save("ERC20TransferProxy", {
    address: expectedAddressTransferProxy,
    ...(await hre.deployments.getExtendedArtifact("ERC20TransferProxy"))
  })

};
export default func;
func.tags = ['oasys', "now"];
