const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getSettings, id, getProxyImplementation } = require("./config.js")

const ERC721RaribleMinimalBeacon = artifacts.require('ERC721RaribleMinimalBeacon');
const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

module.exports = async function (deployer, network) {

  /*
  //upgrading erc721 contract
  const erc721Proxy = await ERC721RaribleMeta.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721RaribleMeta, { deployer });
  */

  //getting new implementation address
  const erc721 = await getProxyImplementation(ERC721RaribleMeta, network, ProxyAdmin)
  //upgrading erc721 beacon
  const beacon721Minimal = await ERC721RaribleMinimalBeacon.deployed()
  console.log(`old impl 721 = ${await beacon721Minimal.implementation()}`)
  await beacon721Minimal.upgradeTo(erc721)
  console.log(`new impl 721 = ${await beacon721Minimal.implementation()}`)

  /*
  //upgrading erc1155 contract
  const erc1155Proxy = await ERC1155RaribleMeta.deployed();
  await upgradeProxy(erc1155Proxy.address, ERC1155RaribleMeta, { deployer });
  */

  //getting new implementation address
  const erc1155 = await getProxyImplementation(ERC1155RaribleMeta, network, ProxyAdmin)

  //upgrading erc1155 beacon
  const beacon1155 = await ERC1155RaribleBeacon.deployed();
  console.log(`old impl 1155 = ${await beacon1155.implementation()}`)
  await beacon1155.upgradeTo(erc1155)
  console.log(`new impl 1155 = ${await beacon1155.implementation()}`)

};