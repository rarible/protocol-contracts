const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation } = require("./config.js")

const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721Rarible = artifacts.require('ERC721Rarible');

const ERC721RaribleFactoryC2 = artifacts.require('ERC721RaribleFactoryC2');
const ERC1155RaribleFactoryC2 = artifacts.require('ERC1155RaribleFactoryC2');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');

const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

async function deployMinimal721(deployer, network, transferProxy, erc721LazyMintTransferProxy) {
  //deploying erc721 minimal
  const erc721Proxy = await deployProxy(ERC721RaribleMinimal, ["Rarible", "RARI", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed erc721 minimal at", erc721Proxy.address)

  const erc721minimal = await getProxyImplementation(ERC721RaribleMinimal, network, ProxyAdmin)

  //upgrading 721 beacon
  const beacon721 = await ERC721RaribleBeacon.deployed();
  console.log(`old impl 721 = ${await beacon721.implementation()}`)
  await beacon721.upgradeTo(erc721minimal)
  console.log(`new impl 721 = ${await beacon721.implementation()}`);

  //deploying factory
  const factory721 = await deployer.deploy(ERC721RaribleFactoryC2, beacon721.address, transferProxy, erc721LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory721 minimal at ${factory721.address}`)
}

async function upgrade721(deployer) {
  //upgrade 721 proxy
  const erc721Proxy = await ERC721Rarible.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721Rarible, { deployer });
}

async function deployAndUpgrade1155(deployer, network, transferProxy, erc1155LazyMintTransferProxy) {
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
  const factory1155 = await deployer.deploy(ERC1155RaribleFactoryC2, beacon1155.address, transferProxy, erc1155LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory1155 at ${factory1155.address}`)
  
}

module.exports = async function (deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  //deploy new erc721Minimal proxy and factory, use old 721 beacon
  await deployMinimal721(deployer, network, transferProxy, erc721LazyMintTransferProxy);

  //upgrade old 721 proxy
  await upgrade721(deployer);

  //upgrade old 1155 proxy, upgrade old 1155 beacon, deploy new 1155 factory
  await deployAndUpgrade1155(deployer, network, transferProxy, erc1155LazyMintTransferProxy);
  
};
