const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation, getSettings, updateImplementation, getGasMultiplier } = require("./config.js")

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155RaribleBeaconMeta = artifacts.require('ERC1155RaribleBeaconMeta');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleFactoryC2 = artifacts.require('ERC1155RaribleFactoryC2');

const TransferProxy = artifacts.require('TransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

module.exports = async function (deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  const { deploy_meta, deploy_non_meta } = getSettings(network);

  if (!!deploy_meta) {
    await updateERC1155(ERC1155RaribleMeta, ERC1155RaribleBeaconMeta, transferProxy, erc1155LazyMintTransferProxy, deployer, network);
  } 
  
  if (!!deploy_non_meta){
    await updateERC1155(ERC1155Rarible, ERC1155RaribleBeacon, transferProxy, erc1155LazyMintTransferProxy, deployer, network);
  }

};

async function updateERC1155(erc1155toDeploy, beacon, transferProxy, erc1155LazyMintTransferProxy, deployer, network) {
  //upgrade 1155 proxy
  const erc1155Proxy = await erc1155toDeploy.deployed();
  await upgradeProxy(erc1155Proxy.address, erc1155toDeploy, { deployer });

  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)

  //upgrading 1155 beacon
  const beacon1155 = await beacon.deployed();
  await updateImplementation(beacon1155, erc1155)
  
  //deploying new factory
  const factory1155 = await deployer.deploy(ERC1155RaribleFactoryC2, beacon1155.address, transferProxy, erc1155LazyMintTransferProxy, { gas: 2500000 * getGasMultiplier(network) });
  console.log(`deployed factory1155 at ${factory1155.address}`)
}