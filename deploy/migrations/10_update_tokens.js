const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { getProxyImplementation, getSettings } = require("./config.js")

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');

const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

module.exports = async function (deployer, network) {
  const { meta_support } = getSettings(network);
  let erc1155toDeploy;
  //deploying ERC1155 with meta support if needed
  if (!!meta_support) {
    erc1155toDeploy = ERC1155RaribleMeta;
  } else {
    erc1155toDeploy = ERC1155Rarible;
  }

  //upgrading erc721 token
  const erc721Proxy = await ERC721Rarible.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721Rarible, { deployer });

  //upgrading erc1155 token
  const erc1155Proxy = await erc1155toDeploy.deployed();
  await upgradeProxy(erc1155Proxy.address, erc1155toDeploy, { deployer });

  //upgrading erc721 factory
  const erc721 = await getProxyImplementation(ERC721Rarible, network, ProxyAdmin)
  const beacon721 = await ERC721RaribleBeacon.deployed();
  console.log(`old impl 721 = ${await beacon721.implementation()}`)
  await beacon721.upgradeTo(erc721)
  console.log(`new impl 721 = ${await beacon721.implementation()}`)

  //upgrading erc1155 factory
  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)
  const beacon1155 = await ERC1155RaribleBeacon.deployed();
  console.log(`old impl 1155 = ${await beacon1155.implementation()}`)
  await beacon1155.upgradeTo(erc1155)
  console.log(`new impl 1155 = ${await beacon1155.implementation()}`)

};