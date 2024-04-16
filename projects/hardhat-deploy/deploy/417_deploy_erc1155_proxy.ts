import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt} from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log('')

  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create TransparentUpgradeableProxy
  const implAddr = (await hre.deployments.get("ERC1155Rarible_Implementation")).address;
  const adminAddr = (await hre.deployments.get("DefaultProxyAdmin")).address;
  const TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const dtxTransparentUpgradeableProxy = await TransparentUpgradeableProxy.getDeployTransaction(implAddr, adminAddr, "0x")
  //console.log("8.1.! bytecode for erc1155Proxy:",dtxTransparentUpgradeableProxy)
  var fs = require('fs');
  fs.writeFileSync('./ERC1155Rarible_Proxy.txt', dtxTransparentUpgradeableProxy.data , 'utf-8');

  //predict address
  const salt = getSalt();
  const expectedAddressTransparentUpgradeableProxy = await factory.getDeploymentAddress(dtxTransparentUpgradeableProxy.data, salt)
  const erc1155Proxy = await hre.ethers.getContractAt('ERC1155Rarible', expectedAddressTransparentUpgradeableProxy);
  console.log("8.2.! Predict address for erc1155Proxy: ", expectedAddressTransparentUpgradeableProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("8.3.! transfer ownership calldata for erc1155Proxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc1155LazyMintTransferProxyAddress = (await hre.deployments.get("ERC1155LazyMintTransferProxy")).address;

  const initCalldata = (await erc1155Proxy.populateTransaction.__ERC1155Rarible_init("Rarible", "RARI", "ipfs:/", "", transferProxyyAddress, erc1155LazyMintTransferProxyAddress)).data;
  console.log("8.4.! init calldata for erc1155Proxy: ", initCalldata)

  //deploy erc1155Proxy
  //await( await factory.create(0, salt, dtxTransparentUpgradeableProxy.data, expectedAddressTransparentUpgradeableProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check erc1155Proxy
  //console.log("erc1155Proxy owner:", await erc1155Proxy.owner())

  //save artifact
  await hre.deployments.save("ERC1155Rarible", {
    address: expectedAddressTransparentUpgradeableProxy,
    ...(await hre.deployments.getExtendedArtifact("TransparentUpgradeableProxy"))
  })

};
export default func;
func.tags = ['oasys', "now"];
