const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation } = require("./config.js")

const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721RaribleUserMinimal = artifacts.require('ERC721RaribleUserMinimal');
const ERC1155RaribleUser = artifacts.require('ERC1155RaribleUser');

const ERC721RaribleUserFactoryC2 = artifacts.require('ERC721RaribleUserFactoryC2');
const ERC721RaribleFactoryC2 = artifacts.require('ERC721RaribleFactoryC2');
const ERC1155RaribleUserFactoryC2 = artifacts.require('ERC1155RaribleUserFactoryC2');
const ERC1155RaribleFactoryC2 = artifacts.require('ERC1155RaribleFactoryC2');

const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC721RaribleBeaconMinimal = artifacts.require('ERC721RaribleBeaconMinimal');
const ERC721RaribleBeaconUser = artifacts.require('ERC721RaribleBeaconUser');
const ERC1155RaribleBeaconUser = artifacts.require('ERC1155RaribleBeaconUser');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

async function deployMinimal721(deployer, network, transferProxy, erc721LazyMintTransferProxy) {
  //deploying erc721 minimal
  const erc721Proxy = await deployProxy(ERC721RaribleMinimal, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed erc721 minimal at", erc721Proxy.address)

  //setting default approvers
  await erc721Proxy.setDefaultApproval(erc721LazyMintTransferProxy, true, { gas: 100000 });
  await erc721Proxy.setDefaultApproval(transferProxy, true, { gas: 100000 });

  const erc721minimal = await getProxyImplementation(ERC721RaribleMinimal, network, ProxyAdmin)

  //deploying ERC721RaribleUserMinimal
  const beacon721minimal = await deployer.deploy(ERC721RaribleBeaconMinimal, erc721minimal, { gas: 1000000 });

  //deploying factory
  const factory721 = await deployer.deploy(ERC721RaribleFactoryC2, beacon721minimal.address, transferProxy, erc721LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory721 minimal at ${factory721.address}`)
}

async function deployUser721(deployer) {
  ///deploying erc721 user
  await deployer.deploy(ERC721RaribleUserMinimal, { gas: 5500000 });
  const erc721user = await ERC721RaribleUserMinimal.deployed()
  console.log("deployed user erc721 at", erc721user.address)

  //deploying ERC721RaribleUserMinimal
  const beacon721user = await deployer.deploy(ERC721RaribleBeaconUser, erc721user.address, { gas: 1000000 });

  //deploying factory
  const factory721user = await deployer.deploy(ERC721RaribleUserFactoryC2, beacon721user.address, { gas: 1500000 });
  console.log(`deployed user factory721 at ${factory721user.address}`)
}

async function deployUser1155(deployer) {
  //deploying erc1155 user
  await deployer.deploy(ERC1155RaribleUser, { gas: 5500000 });
  const erc1155user = await ERC1155RaribleUser.deployed()
  console.log("deployed user erc1155 at", erc1155user.address)

  //deploying ERC1155RaribleUser
  const beacon1155user = await deployer.deploy(ERC1155RaribleBeaconUser, erc1155user.address, { gas: 1000000 });

  //deploying factory
  const factory1155user = await deployer.deploy(ERC1155RaribleUserFactoryC2, beacon1155user.address, { gas: 1500000 });
  console.log(`deployed user factory1155 at ${factory1155user.address}`)
}

async function deployERC1155Factory(deployer, transferProxy, erc1155LazyMintTransferProxy) {
  const beacon = await ERC1155RaribleBeacon.deployed();

  //deploying factory
  const factory = await deployer.deploy(ERC1155RaribleFactoryC2, beacon.address, transferProxy, erc1155LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory1155 at ${factory.address}`)
}

async function deployERC721Factory(deployer, transferProxy, erc721LazyMintTransferProxy) {
  const beacon = await ERC721RaribleBeacon.deployed();

  //deploying factory
  const factory = await deployer.deploy(ERC721RaribleFactoryC2, beacon.address, transferProxy, erc721LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed factory721 at ${factory.address}`)
}

module.exports = async function (deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  const erc1155LazyMintTransferProxy = (await ERC1155LazyMintTransferProxy.deployed()).address;

  //deploy new erc721Minimal proxy, beacon and factory
  await deployMinimal721(deployer, network, transferProxy, erc721LazyMintTransferProxy);

  //depploy new user721 impl,beacon and factory
  await deployUser721(deployer);

  //deploy new user1155 impl, beacon and factory
  await deployUser1155(deployer);

  //deploying new factory for ERC1155, using old beacon
  await deployERC1155Factory(deployer, transferProxy, erc1155LazyMintTransferProxy)

  //deploying new factory for ERC721, using old beacon
  await deployERC721Factory(deployer, transferProxy, erc721LazyMintTransferProxy)
  
};
