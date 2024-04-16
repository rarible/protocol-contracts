import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt} from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log('')

  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create TransparentUpgradeableProxy
  const implAddr = (await hre.deployments.get("ExchangeV2_Implementation")).address;
  const adminAddr = (await hre.deployments.get("DefaultProxyAdmin")).address;
  const TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const dtxTransparentUpgradeableProxy = await TransparentUpgradeableProxy.getDeployTransaction(implAddr, adminAddr, "0x")
  //console.log("8.1.! bytecode for exchangeV2Proxy:",dtxTransparentUpgradeableProxy)
  var fs = require('fs');
  fs.writeFileSync('./ExchangeV2_Proxy.txt', dtxTransparentUpgradeableProxy.data , 'utf-8');
  
  //predict address
  const salt = getSalt();
  const expectedAddressTransparentUpgradeableProxy = await factory.getDeploymentAddress(dtxTransparentUpgradeableProxy.data, salt)
  const exchangeV2Proxy = await hre.ethers.getContractAt('ExchangeV2', expectedAddressTransparentUpgradeableProxy);
  console.log("8.2.! Predict address for exchangeV2Proxy: ", expectedAddressTransparentUpgradeableProxy)
  
  //prepare ownership transfer calldata
  const ownershipCalldata = await prepareTransferOwnershipCalldata(hre);
  console.log("8.3.! transfer ownership calldata for exchangeV2Proxy: ", ownershipCalldata)

  //prepare init transfer calldata
  const royaltiesRegistryAddress = (await hre.deployments.get("RoyaltiesRegistry")).address;
  const transferProxy = await hre.deployments.get("TransferProxy")
  const erc20TransferProxy = await hre.deployments.get("ERC20TransferProxy")

  const initCalldata = (await exchangeV2Proxy.populateTransaction.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, 0, hre.ethers.constants.AddressZero, royaltiesRegistryAddress)).data;
  console.log("8.4.! init calldata for exchangeV2Proxy: ", initCalldata)

  //deploy exchangeV2Proxy
  //await( await factory.create(0, salt, dtxTransparentUpgradeableProxy.data, expectedAddressTransparentUpgradeableProxy, "", [initCalldata, ownershipCalldata])).wait()

  //check exchangeV2Proxy
  //console.log("exchangeV2Proxy owner:", await exchangeV2Proxy.owner())

  //save artifact
  await hre.deployments.save("ExchangeV2", {
    address: expectedAddressTransparentUpgradeableProxy,
    ...(await hre.deployments.getExtendedArtifact("TransparentUpgradeableProxy"))
  })

};
export default func;
func.tags = ['oasys', 'now'];
