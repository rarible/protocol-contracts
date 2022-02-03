const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation } = require("./config.js")

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');

const ERC721RaribleMinimalBeacon = artifacts.require('ERC721RaribleMinimalBeacon');
const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');

module.exports = async function (deployer, network) {

  //upgrade 1155 proxy
  const erc1155Proxy = await ERC1155Rarible.deployed();
  await upgradeProxy(erc1155Proxy.address, ERC1155Rarible, { deployer });

  const erc1155 = await getProxyImplementation(ERC1155Rarible, network, ProxyAdmin)

  //upgrading 1155 beacon
  const beacon1155 = await ERC1155RaribleBeacon.deployed();
  console.log(`old impl 1155 = ${await beacon1155.implementation()}`)
  await beacon1155.upgradeTo(erc1155)
  console.log(`new impl 1155 = ${await beacon1155.implementation()}`)


  //upgrade 721 proxy
  const erc721Proxy = await ERC721RaribleMinimal.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721RaribleMinimal, { deployer });

  const erc721 = await getProxyImplementation(ERC721RaribleMinimal, network, ProxyAdmin)

  //upgrading 721 beacon
  const beacon721 = await ERC721RaribleMinimalBeacon.deployed();
  console.log(`old impl 721 = ${await beacon721.implementation()}`)
  await beacon721.upgradeTo(erc721)
  console.log(`new impl 721 = ${await beacon721.implementation()}`)

};
