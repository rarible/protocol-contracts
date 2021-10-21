const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721RaribleUserMinimal = artifacts.require('ERC721RaribleUserMinimal');

const ERC721RaribleUserFactoryC2 = artifacts.require('ERC721RaribleUserFactoryC2');
const ERC721RaribleFactoryC2 = artifacts.require('ERC721RaribleFactoryC2');

const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');

const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleUser = artifacts.require('ERC1155RaribleUser');

const ERC1155RaribleUserFactoryC2 = artifacts.require('ERC1155RaribleUserFactoryC2');
const ERC1155RaribleFactoryC2 = artifacts.require('ERC1155RaribleFactoryC2');

const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

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
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  //deploying erc721 user proxy
  const erc721Proxyuser = await deployProxy(ERC721RaribleUserMinimal, ["Rarible", "RARI", "ipfs:/", "", [erc721LazyMintTransferProxy, transferProxy]], { deployer, initializer: '__ERC721RaribleUser_init' });
  console.log("deployed user erc721 at", erc721Proxyuser.address)

  //deploying erc712 factory
  //ERC721RaribleUserMinimal implementation
  const erc721user = await getProxyImplementation(ERC721RaribleUserMinimal, network)

  //deploying ERC721RaribleUserMinimal
  const beacon721user = await deployer.deploy(ERC721RaribleBeacon, erc721user, { gas: 1000000 });

  //deploying factory
  const factory721user = await deployer.deploy(ERC721RaribleUserFactoryC2, beacon721user.address, { gas: 1500000 });
  console.log(`deployed user factory721 at ${factory721user.address}`)

  //deploying erc1155 proxy
  const erc1155Proxyuser = await deployProxy(ERC1155RaribleUser, ["Rarible", "RARI", "ipfs:/", "", [erc1155LazyMintTransferProxy, transferProxy]], { deployer, initializer: '__ERC1155RaribleUser_init' });
  console.log("deployed user erc1155 at", erc1155Proxyuser.address)

  //deploying erc712 factory
  //ERC1155RaribleUser implementation
  const erc1155user = await getProxyImplementation(ERC1155RaribleUser, network)

  //deploying ERC1155RaribleUser
  const beacon1155user = await deployer.deploy(ERC1155RaribleBeacon, erc1155user, { gas: 1000000 });

  //deploying factory
  const factory1155user = await deployer.deploy(ERC1155RaribleUserFactoryC2, beacon1155user.address, { gas: 1500000 });
  console.log(`deployed user factory1155 at ${factory1155user.address}`)

  //deploying erc721 minimal + factory
  const erc721Proxy = await deployProxy(ERC721RaribleMinimal, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed erc721 at", erc721Proxy.address)
  //setting default approvers
  await erc721Proxy.setDefaultApproval(erc721LazyMintTransferProxy, true, { gas: 100000 });
  await erc721Proxy.setDefaultApproval(transferProxy, true, { gas: 100000 });

  const erc721 = await getProxyImplementation(ERC721RaribleMinimal, network)

  //deploying ERC721RaribleUserMinimal
  const beacon721 = await deployer.deploy(ERC721RaribleBeacon, erc721, { gas: 1000000 });

  //deploying factory
  const factory721 = await deployer.deploy(ERC721RaribleFactoryC2, beacon721.address, transferProxy, erc721LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory721 at ${factory721.address}`)

  //deploying new factory for ERC1155
  const erc1155 = await getProxyImplementation(ERC1155Rarible, network)

  //deploying ERC1155Rarible
  const beacon1155 = await deployer.deploy(ERC1155RaribleBeacon, erc1155, { gas: 1000000 });

  //deploying factory
  const factory1155 = await deployer.deploy(ERC1155RaribleFactoryC2, beacon1155.address, transferProxy, erc1155LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory1155 at ${factory1155.address}`)

};
