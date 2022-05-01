const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation, getSettings, updateImplementation } = require("./config.js")

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');
const ERC1155RaribleBeaconMeta = artifacts.require('ERC1155RaribleBeaconMeta');

const ERC721RaribleMinimalBeacon = artifacts.require('ERC721RaribleMinimalBeacon');
const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');
const ERC721RaribleMinimalBeaconMeta = artifacts.require('ERC721RaribleMinimalBeaconMeta');

module.exports = async function (deployer, network) {
  const { deploy_meta, deploy_non_meta } = getSettings(network);

  if (!!deploy_meta) {
    await deployTokens(ERC1155RaribleMeta, ERC1155RaribleBeaconMeta, ERC721RaribleMeta, ERC721RaribleMinimalBeaconMeta, deployer, network);
  } 
  
  if (!!deploy_non_meta){
    await deployTokens(ERC1155Rarible, ERC1155RaribleBeacon, ERC721RaribleMinimal, ERC721RaribleMinimalBeacon, deployer, network);
  }

};

async function deployTokens(erc1155toDeploy, erc1155Beacon, erc721toDeploy, erc721Beacon, deployer, network) {
  //upgrade 1155 proxy
  const erc1155Proxy = await erc1155toDeploy.deployed();
  await upgradeProxy(erc1155Proxy.address, erc1155toDeploy, { deployer });

  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)

  //upgrading 1155 beacon
  const beacon1155 = await erc1155Beacon.deployed();
  await updateImplementation(beacon1155, erc1155)

  //upgrade 721 proxy
  const erc721Proxy = await erc721toDeploy.deployed();
  await upgradeProxy(erc721Proxy.address, erc721toDeploy, { deployer });

  const erc721 = await getProxyImplementation(erc721toDeploy, network, ProxyAdmin)

  //upgrading 721 beacon
  const beacon721 = await erc721Beacon.deployed();
  await updateImplementation(beacon721, erc721)
}