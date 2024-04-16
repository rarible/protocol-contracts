import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt} from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log('')

  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create TransparentUpgradeableProxy
  const implAddr = (await hre.deployments.get("ERC721RaribleMinimal_Implementation")).address;
  const adminAddr = (await hre.deployments.get("DefaultProxyAdmin")).address;
  const TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const dtxTransparentUpgradeableProxy = await TransparentUpgradeableProxy.getDeployTransaction(implAddr, adminAddr, "0x")
  //console.log("8.1.! bytecode for erc721Proxy:",dtxTransparentUpgradeableProxy)
  var fs = require('fs');
  fs.writeFileSync('./ERC721RaribleMinimal_Proxy.txt', dtxTransparentUpgradeableProxy.data , 'utf-8');

  //predict address
  const salt = getSalt();
  const expectedAddressTransparentUpgradeableProxy = await factory.getDeploymentAddress(dtxTransparentUpgradeableProxy.data, salt)
  const erc721Proxy = await hre.ethers.getContractAt('ERC721RaribleMinimal', expectedAddressTransparentUpgradeableProxy);
  console.log("8.2.! Predict address for erc721Proxy: ", expectedAddressTransparentUpgradeableProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("8.3.! transfer ownership calldata for erc721Proxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc721LazyMintTransferProxyAddress = (await hre.deployments.get("ERC721LazyMintTransferProxy")).address;

  const initCalldata = (await erc721Proxy.populateTransaction.__ERC721Rarible_init("Rarible", "RARI", "ipfs:/", "", transferProxyyAddress, erc721LazyMintTransferProxyAddress)).data;
  console.log("8.4.! init calldata for erc721Proxy: ", initCalldata)

  //deploy erc721Proxy
  //await( await factory.create(0, salt, dtxTransparentUpgradeableProxy.data, expectedAddressTransparentUpgradeableProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check erc721Proxy
  //console.log("erc721Proxy owner:", await erc721Proxy.owner())

  //save artifact
  await hre.deployments.save("ERC721RaribleMinimal", {
    address: expectedAddressTransparentUpgradeableProxy,
    ...(await hre.deployments.getExtendedArtifact("TransparentUpgradeableProxy"))
  })

};
export default func;
func.tags = ['oasys', "now"];
