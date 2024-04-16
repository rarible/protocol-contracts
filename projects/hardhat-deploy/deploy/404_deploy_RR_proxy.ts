import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt} from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log('')

  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create TransparentUpgradeableProxy
  const implAddr = (await hre.deployments.get("RoyaltiesRegistry_Implementation")).address;
  const adminAddr = (await hre.deployments.get("DefaultProxyAdmin")).address;
  const TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const dtxTransparentUpgradeableProxy = await TransparentUpgradeableProxy.getDeployTransaction(implAddr, adminAddr, "0x")
  //console.log("3.1.! bytecode for rrProxy:",dtxTransparentUpgradeableProxy)
  var fs = require('fs');
  fs.writeFileSync('./RoyaltiesRegistry_Proxy.txt', dtxTransparentUpgradeableProxy.data , 'utf-8');
  
  //predict address
  const salt = getSalt();
  const expectedAddressTransparentUpgradeableProxy = await factory.getDeploymentAddress(dtxTransparentUpgradeableProxy.data, salt)
  const rrProxy = await hre.ethers.getContractAt('RoyaltiesRegistry', expectedAddressTransparentUpgradeableProxy);
  console.log("3.2.! Predict address for rrProxy: ", expectedAddressTransparentUpgradeableProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("3.3.! transfer ownership calldata for rrProxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const initCalldata = (await rrProxy.populateTransaction.__RoyaltiesRegistry_init()).data;
  console.log("3.4.! init calldata for rrProxy: ", initCalldata)

  //deploy rrProxy
  //await( await factory.create(0, salt, dtxTransparentUpgradeableProxy.data, expectedAddressTransparentUpgradeableProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check rrProxy
  //console.log("rrProxy owner:", await rrProxy.owner())

  //save artifact
  await hre.deployments.save("RoyaltiesRegistry", {
    address: expectedAddressTransparentUpgradeableProxy,
    ...(await hre.deployments.getExtendedArtifact("TransparentUpgradeableProxy"))
  })

};
export default func;
func.tags = ['oasys', 'now'];
