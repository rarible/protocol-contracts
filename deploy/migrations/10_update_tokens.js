const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { getProxyImplementation, getSettings, updateImplementation } = require("./config.js")

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155RaribleBeaconMeta = artifacts.require('ERC1155RaribleBeaconMeta');

const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

module.exports = async function (deployer, network) {
  const { deploy_meta, deploy_non_meta } = getSettings(network);

  if (!!deploy_meta) {
    await upgradeERC1155(ERC1155RaribleMeta, ERC1155RaribleBeaconMeta, deployer, network);
  } 
  
  if (!!deploy_non_meta){
    await upgradeERC1155(ERC1155Rarible, ERC1155RaribleBeacon, deployer, network);
  }

  //upgrading erc721 token
  const erc721Proxy = await ERC721Rarible.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721Rarible, { deployer });

  //upgrading erc721 factory
  const erc721 = await getProxyImplementation(ERC721Rarible, network, ProxyAdmin)
  const beacon721 = await ERC721RaribleBeacon.deployed();
  await updateImplementation(beacon721, erc721)

};

async function upgradeERC1155(erc1155toDeploy, beacon, deployer, network) {
  //upgrading erc1155 token
  const erc1155Proxy = await erc1155toDeploy.deployed();
  await upgradeProxy(erc1155Proxy.address, erc1155toDeploy, { deployer });

  //upgrading erc1155 factory
  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)
  const beacon1155 = await beacon.deployed();

  await updateImplementation(beacon1155, erc1155);
}
