const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation, getSettings } = require("./config.js")

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

const ERC721RaribleMinimalBeacon = artifacts.require('ERC721RaribleMinimalBeacon');
const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');

module.exports = async function (deployer, network) {
  const { meta_support } = getSettings(network);

  let erc1155toDeploy;
  let erc721toDeploy;
  if (!!meta_support) {
    erc1155toDeploy = ERC1155RaribleMeta;
    erc721toDeploy = ERC721RaribleMeta;
  } else {
    erc1155toDeploy = ERC1155Rarible;
    erc721toDeploy = ERC721RaribleMinimal;
  }

  //upgrade 1155 proxy
  const erc1155Proxy = await erc1155toDeploy.deployed();
  await upgradeProxy(erc1155Proxy.address, erc1155toDeploy, { deployer });

  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)

  //upgrading 1155 beacon
  const beacon1155 = await ERC1155RaribleBeacon.deployed();
  console.log(`old impl 1155 = ${await beacon1155.implementation()}`)
  await beacon1155.upgradeTo(erc1155)
  console.log(`new impl 1155 = ${await beacon1155.implementation()}`)


  //upgrade 721 proxy
  const erc721Proxy = await erc721toDeploy.deployed();
  await upgradeProxy(erc721Proxy.address, erc721toDeploy, { deployer });

  const erc721 = await getProxyImplementation(erc721toDeploy, network, ProxyAdmin)

  //upgrading 721 beacon
  const beacon721 = await ERC721RaribleMinimalBeacon.deployed();
  console.log(`old impl 721 = ${await beacon721.implementation()}`)
  await beacon721.upgradeTo(erc721)
  console.log(`new impl 721 = ${await beacon721.implementation()}`)

};
