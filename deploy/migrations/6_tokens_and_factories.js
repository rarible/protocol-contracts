const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation } = require("./config.js")

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC721RaribleFactory = artifacts.require('ERC721RaribleFactory');
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155RaribleFactory = artifacts.require('ERC1155RaribleFactory');
const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

module.exports = async function (deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  //deploying erc721 proxy
  const erc721Proxy = await deployProxy(ERC721Rarible, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed erc721 at", erc721Proxy.address)
  //setting default approvers
  await erc721Proxy.setDefaultApproval(erc721LazyMintTransferProxy, true, { gas: 100000 });
  await erc721Proxy.setDefaultApproval(transferProxy, true, { gas: 100000 });

  //deploying erc1155 proxy
  const erc1155Proxy = await deployProxy(ERC1155Rarible, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC1155Rarible_init' });
  console.log("deployed erc1155 at", erc1155Proxy.address)
  //setting default approvers
  await erc1155Proxy.setDefaultApproval(erc1155LazyMintTransferProxy, true, { gas: 100000 });
  await erc1155Proxy.setDefaultApproval(transferProxy, true, { gas: 100000 });

  //deploying erc712 factory
  //ERC721Rarible implementation
  const erc721 = await getProxyImplementation(ERC721Rarible, network, ProxyAdmin)

  //deploying ERC721RaribleBeacon
  const beacon721 = await deployer.deploy(ERC721RaribleBeacon, erc721, { gas: 1000000 });

  //deploying factory
  const factory721 = await deployer.deploy(ERC721RaribleFactory, beacon721.address, transferProxy, erc721LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory721 at ${factory721.address}`)

  //deploying erc1155 factory
  //ERC1155Rarible implementation
  const erc1155 = await getProxyImplementation(ERC1155Rarible, network, ProxyAdmin)

  //deploying ERC1155RaribleBeacon
  const beacon1155 = await deployer.deploy(ERC1155RaribleBeacon, erc1155, { gas: 1000000 });

  //deploying factory1155
  const factory1155 = await deployer.deploy(ERC1155RaribleFactory, beacon1155.address, transferProxy, erc1155LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory1155 at ${factory1155.address}`)

};