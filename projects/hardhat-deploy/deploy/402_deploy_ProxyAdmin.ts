import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { prepareTransferOwnershipCalldata } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(``)

  const { deployer } = await hre.getNamedAccounts();

  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);
  console.log(await factory.version())

  //get bytecode to create ProxyAdmin
  const ProxyAdmin = await hre.ethers.getContractFactory("@openzeppelin/contracts-sol08/proxy/transparent/ProxyAdmin.sol:ProxyAdmin");
  const dtxProxyAdmin = await ProxyAdmin.getDeployTransaction()
  //console.log("1.1.! bytecode for ProxyAdmin:",dtxProxyAdmin)

  //predict address
  const salt = hre.ethers.constants.HashZero;
  const expectedAddressProxyAdmin = await factory.getDeploymentAddress(dtxProxyAdmin.data, salt)
  const proxyAdmin = await hre.ethers.getContractAt('@openzeppelin/contracts-sol08/proxy/transparent/ProxyAdmin.sol:ProxyAdmin', expectedAddressProxyAdmin);
  console.log("1.2.! Predict address for ProxyAdmin: ", expectedAddressProxyAdmin)

  //prepare calldata to transferOwnership
  const transferOwnershipTo = deployer;
  console.log("transferring ownership to ", transferOwnershipTo)
  const calldata = await prepareTransferOwnershipCalldata(hre);
  console.log("1.3.! transfer ownership calldata for ProxyAdmin: ", calldata)

  //deploy ProxyAdmin
  await( await factory.create(0, salt, dtxProxyAdmin.data, expectedAddressProxyAdmin, "", [calldata])).wait()

  //check ProxyAdmin
  console.log("ProxyAdmin owner:", await proxyAdmin.owner())
  await hre.deployments.save("DefaultProxyAdmin", {
    address: expectedAddressProxyAdmin,
    ...(await hre.deployments.getExtendedArtifact("@openzeppelin/contracts-sol08/proxy/transparent/ProxyAdmin.sol:ProxyAdmin"))
  })

};
export default func;
func.tags = ['oasys'];
