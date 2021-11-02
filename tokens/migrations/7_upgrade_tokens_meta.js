const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');

async function getProxyImplementation(contract, network) {
  if (network === "test") {
    network = "unknown-1337"
  }

  if (network === "e2e") {
    network = "unknown-17"
  }

  let json;
  try {
    json = require(`../.openzeppelin/${network}.json`)
  } catch (e) {
    const tconfig = require('../truffle-config.js')
    const network_id = tconfig.networks[network].network_id;
    json = require(`../.openzeppelin/unknown-${network_id}.json`)
  }
  const c = await ProxyAdmin.at(json.admin.address)
  const deployed = await contract.deployed()
  return c.getProxyImplementation(deployed.address)
}

module.exports = async function (deployer, network) {
  const existing721 = await ERC721Rarible.deployed();
  await upgradeProxy(existing721.address, ERC721RaribleMeta, { deployer });

  const existing1155 = await ERC1155Rarible.deployed();
  await upgradeProxy(existing1155.address, ERC1155RaribleMeta, { deployer });

  //upgrading erc721 factory
  const erc721 = await getProxyImplementation(ERC721Rarible, network)
  const beacon721 = await ERC721RaribleBeacon.deployed();
  console.log(`old impl 721 = ${await beacon721.implementation()}`)
  await beacon721.upgradeTo(erc721)
  console.log(`new impl 721 = ${await beacon721.implementation()}`)

  //upgrading erc1155 factory
  const erc1155 = await getProxyImplementation(ERC1155Rarible, network)
  const beacon1155 = await ERC1155RaribleBeacon.deployed();
  console.log(`old impl 1155 = ${await beacon1155.implementation()}`)
  await beacon1155.upgradeTo(erc1155)
  console.log(`new impl 1155 = ${await beacon1155.implementation()}`)
};