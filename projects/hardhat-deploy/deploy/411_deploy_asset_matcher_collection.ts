import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create AssetMatcherCollection
  const AssetMatcherCollection = await hre.ethers.getContractFactory("AssetMatcherCollection");
  const dtx = await AssetMatcherCollection.getDeployTransaction();
  //console.dir(dtx, {depth:null})
  //var fs = require('fs');
  //fs.writeFileSync('./ExchangeV2_bytecode.txt', dtx.data , 'utf-8');
  var fs = require('fs');
  fs.writeFileSync('./AssetMatcherCollection.txt', dtx.data , 'utf-8');
  
  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let assetMatcherCollection = await hre.ethers.getContractAt('AssetMatcherCollection', expectedAddress);
  console.log("7.2.! Predict address for assetMatcherCollection: ", expectedAddress)

  //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [])).wait()
  
  //save artifact
  await hre.deployments.save("AssetMatcherCollection", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("AssetMatcherCollection"))
  })

};
export default func;
func.tags = ['oasys', "now"];
