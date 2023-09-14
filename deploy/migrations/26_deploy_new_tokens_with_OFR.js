const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation, getSettings, updateImplementation, getOFRSubscriptionAddress } = require("./config.js")

//1155
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');
const ERC1155RaribleBeaconMeta = artifacts.require('ERC1155RaribleBeaconMeta');
const ERC1155RaribleFactoryC2 = artifacts.require('ERC1155RaribleFactoryC2');

//721 minimal
const ERC721RaribleMinimalBeacon = artifacts.require('ERC721RaribleMinimalBeacon');
const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');
const ERC721RaribleMinimalBeaconMeta = artifacts.require('ERC721RaribleMinimalBeaconMeta');
const ERC721RaribleFactoryC2 = artifacts.require('ERC721RaribleFactoryC2');

//721 deprecated
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC721Rarible = artifacts.require('ERC721Rarible');

//transfer proxies
const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');


module.exports = async function (deployer, network) {
  const { deploy_meta, deploy_non_meta } = getSettings(network);

  if (!!deploy_meta) {
    await deployTokens(ERC1155RaribleMeta, ERC1155RaribleBeaconMeta, ERC721RaribleMeta, ERC721RaribleMinimalBeaconMeta, deployer, network);
  } 
  
  if (!!deploy_non_meta){
    await deployTokens(ERC1155Rarible, ERC1155RaribleBeacon, ERC721RaribleMinimal, ERC721RaribleMinimalBeacon, deployer, network);
  }

  //upgrade deprecated 721 proxy
  const erc721Proxy = await ERC721Rarible.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721Rarible, { deployer });

  const erc721 = await getProxyImplementation(ERC721Rarible, network, ProxyAdmin)

  const beacon721 = await ERC721RaribleBeacon.deployed();

  await updateImplementation(beacon721, erc721)

};

async function deployTokens(erc1155toDeploy, erc1155Beacon, erc721toDeploy, erc721Beacon, deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  //upgrade 1155 proxy
  const erc1155Proxy = await erc1155toDeploy.deployed();
  await upgradeProxy(erc1155Proxy.address, erc1155toDeploy, { deployer });

  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)

  //upgrading 1155 beacon
  const beacon1155 = await erc1155Beacon.deployed();
  await updateImplementation(beacon1155, erc1155)

  //deploy new 1155 factory
  const factory1155 = await deployer.deploy(ERC1155RaribleFactoryC2, beacon1155.address, transferProxy, erc1155LazyMintTransferProxy, getOFRSubscriptionAddress(), { gas: 2500000 });
  console.log(`deployed factory1155 at ${factory1155.address}`)

  //upgrade 721 proxy
  const erc721Proxy = await erc721toDeploy.deployed();
  await upgradeProxy(erc721Proxy.address, erc721toDeploy, { deployer });

  const erc721 = await getProxyImplementation(erc721toDeploy, network, ProxyAdmin)

  //upgrading 721 beacon
  const beacon721 = await erc721Beacon.deployed();
  await updateImplementation(beacon721, erc721)

  //deploying factory 721
  const factory721 = await deployer.deploy(ERC721RaribleFactoryC2, beacon721.address, transferProxy, erc721LazyMintTransferProxy, getOFRSubscriptionAddress(), { gas: 2500000 });
  console.log(`deployed factory721 minimal at ${factory721.address}`)
}