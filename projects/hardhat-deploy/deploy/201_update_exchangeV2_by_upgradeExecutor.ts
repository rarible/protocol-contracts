import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  let contractName: string = "";
  //deploying ExchangeV2 with meta support if needed
  if (!!deploy_meta) {
    contractName = "ExchangeMetaV2";
  }

  if (!!deploy_non_meta) {
    contractName = "ExchangeV2";
  }
  
  //deploying new exchangeV2 impl
  console.log("deploying new exchangeV2 impl...")
  const signers = await hre.ethers.getSigners();
  const exchangeV2Factory = (await hre.ethers.getContractFactory(
    contractName,
    signers[0]
  ));
  const exchangeV2 = await exchangeV2Factory.deploy();
  await exchangeV2.deployed();

  const address = exchangeV2.address;

  console.log("deployed new exchangeV2 impl to: ", address);

  //saving artifacts for the new exchangeV2 impl
  const {save, getExtendedArtifact } = hre.deployments;
  await save(contractName + "_Implementation", {
    address,
    ...(await getExtendedArtifact(contractName))
  })
  console.log("saved artifacts for new exchangeV2 impl")

  //deploy ProxyUpgradeAction contract
  const proxyUpgradeActionReceipt = await deploy("ProxyUpgradeAction", {
    from: deployer,
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
  });

  const ProxyUpgradeAction = await hre.ethers.getContractFactory("ProxyUpgradeAction");
  const proxyUpgradeAction = await ProxyUpgradeAction.attach(proxyUpgradeActionReceipt.address);
  console.log(`using ProxyUpgradeAction at ${proxyUpgradeAction.address}`)
  //get existing upgradeExecutor
  
  const UpgradeExecutor = await hre.ethers.getContractFactory("UpgradeExecutor");
  const upgradeExecutorAddress = (await hre.deployments.get("UpgradeExecutor")).address;
  const upgradeExecutor = await UpgradeExecutor.attach(upgradeExecutorAddress)
  console.log(`using UpgradeExecutor at ${upgradeExecutor.address}`)
  
  //prepare calldata
  const adminAddress = (await hre.deployments.get("DefaultProxyAdmin")).address
  console.log(`using ProxyAdmin address:${adminAddress}`)

  const exchangeV2ProxyAddress = (await hre.deployments.get(contractName)).address
  console.log(`using exchangeV2 proxy: ${exchangeV2ProxyAddress}`)

  const tx = await proxyUpgradeAction.populateTransaction.perform(adminAddress, exchangeV2ProxyAddress, address)
  console.log(`address: ${proxyUpgradeAction.address}`)
  console.log(`calldata: ${tx.data}`)
};

export default func;
func.tags = ['update-exchange-by-upgradeExecutor'];
