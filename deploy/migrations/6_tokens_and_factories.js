const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation, getSettings } = require("./config.js")

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

module.exports = async function (deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  const { meta_support } = getSettings(network);
  let erc1155toDeploy;
  //deploying ERC1155 with meta support if needed
  if (!!meta_support) {
    erc1155toDeploy = ERC1155RaribleMeta;
  } else {
    erc1155toDeploy = ERC1155Rarible;
  }
  //deploying erc721 proxy
  const erc721Proxy = await deployProxy(ERC721Rarible, ["Rarible", "RARI", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed erc721 at", erc721Proxy.address)

  //deploying erc1155 proxy
  const erc1155Proxy = await deployProxy(erc1155toDeploy, ["Rarible", "RARI", "ipfs:/", "", transferProxy, erc1155LazyMintTransferProxy], { deployer, initializer: '__ERC1155Rarible_init' });
  console.log("deployed erc1155 at", erc1155Proxy.address)

  //deploying erc712 factory
  //ERC721Rarible implementation
  const erc721 = await getProxyImplementation(ERC721Rarible, network, ProxyAdmin)

  //deploying ERC721RaribleBeacon
  const beacon721 = await deployer.deploy(ERC721RaribleBeacon, erc721, { gas: 1000000 });

  //deploying erc1155 factory
  //ERC1155Rarible implementation
  const erc1155 = await getProxyImplementation(erc1155toDeploy, network, ProxyAdmin)

  //deploying ERC1155RaribleBeacon
  const beacon1155 = await deployer.deploy(ERC1155RaribleBeacon, erc1155, { gas: 1000000 });

};