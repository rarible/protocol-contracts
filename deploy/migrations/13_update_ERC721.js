const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');

const { getProxyImplementation, updateImplementation } = require("./config.js")

const ERC721Rarible = artifacts.require('ERC721Rarible');

module.exports = async function (deployer, network) {
  //upgrade old 721 proxy
  const erc721Proxy = await ERC721Rarible.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721Rarible, { deployer });

  const erc721 = await getProxyImplementation(ERC721Rarible, network, ProxyAdmin)

  const beacon721 = await ERC721RaribleBeacon.deployed();

  await updateImplementation(beacon721, erc721)
};
