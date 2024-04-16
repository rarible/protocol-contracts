import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { prepareTransferOwnershipCalldata, getSalt } from './help';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)
  
  //get Factory object
  const factoryAddress = (await hre.deployments.get("PermissionedContractFactory")).address;
  const factory = await hre.ethers.getContractAt('PermissionedContractFactory', factoryAddress);

  //get bytecode to create ExchangeV2
  const ExchangeV2 = await hre.ethers.getContractFactory("ExchangeV2");
  const dtx = await ExchangeV2.getDeployTransaction();
  //console.dir(dtx, {depth:null})
  var fs = require('fs');
  fs.writeFileSync('./ExchangeV2_Implementation.txt', dtx.data , 'utf-8');

  //predict address
  const salt = getSalt();
  let expectedAddress = await factory.getDeploymentAddress(dtx.data, salt)
  let exchangeV2 = await hre.ethers.getContractAt('ExchangeV2', expectedAddress);
  console.log("7.2.! Predict address for exchangeV2: ", expectedAddress)

  /*
  //deploy exchangeV2
  if (hre.network.name === "hardhat") {
    exchangeV2 = await ExchangeV2.deploy();
    await exchangeV2.deployed();
    expectedAddress = exchangeV2.address;
  } else {
    //await(await factory.create(0, salt, dtx.data, expectedAddress, "", [])).wait()
  }
  */

  //check rrProxy
  //console.log("exchangeV2 owner:", await exchangeV2.owner())

  //save artifact
  await hre.deployments.save("ExchangeV2_Implementation", {
    address: expectedAddress,
    ...(await hre.deployments.getExtendedArtifact("ExchangeV2"))
  })

};
export default func;
func.tags = ['oasys', "now"];
