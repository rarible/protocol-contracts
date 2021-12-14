const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation } = require("./config.js")

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleFactoryC2 = artifacts.require('ERC1155RaribleFactoryC2');

const TransferProxy = artifacts.require('TransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

module.exports = async function (deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  //upgrade 1155 proxy
  const erc1155Proxy = await ERC1155Rarible.deployed();
  await upgradeProxy(erc1155Proxy.address, ERC1155Rarible, { deployer });

  const erc1155 = await getProxyImplementation(ERC1155Rarible, network, ProxyAdmin)

  //upgrading 1155 beacon
  const beacon1155 = await ERC1155RaribleBeacon.deployed();
  console.log(`old impl 1155 = ${await beacon1155.implementation()}`)
  await beacon1155.upgradeTo(erc1155)
  console.log(`new impl 1155 = ${await beacon1155.implementation()}`)

  //deploying new factory
  const factory1155 = await deployer.deploy(ERC1155RaribleFactoryC2, beacon1155.address, transferProxy, erc1155LazyMintTransferProxy, { gas: 2500000 });
  console.log(`deployed factory1155 at ${factory1155.address}`)

};
