const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation, getSettings, getGasMultiplier } = require("./config.js")

const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');

const ERC721RaribleFactoryC2 = artifacts.require('ERC721RaribleFactoryC2');

const ERC721RaribleMinimalBeacon = artifacts.require('ERC721RaribleMinimalBeacon');
const ERC721RaribleMinimalBeaconMeta = artifacts.require('ERC721RaribleMinimalBeaconMeta');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');

const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');

module.exports = async function (deployer, network) {

  const { deploy_meta, deploy_non_meta } = getSettings(network);

  if (!!deploy_meta) {
    await deployERC721Minimal(ERC721RaribleMeta, ERC721RaribleMinimalBeaconMeta, deployer, network);
  } 

  if (!!deploy_non_meta){
    await deployERC721Minimal(ERC721RaribleMinimal, ERC721RaribleMinimalBeacon, deployer, network);
  }

};

async function deployERC721Minimal(erc721toDeploy, beacon, deployer, network) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;

  //deploying erc721 minimal
  const erc721Proxy = await deployProxy(erc721toDeploy, ["Rarible", "RARI", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed erc721 minimal at", erc721Proxy.address)

  const erc721minimal = await getProxyImplementation(erc721toDeploy, network, ProxyAdmin)

  //upgrading 721 beacon
  await deployer.deploy(beacon, erc721minimal, { gas: 1000000 * getGasMultiplier(network) });
  const beacon721Minimal = await beacon.deployed()

  //deploying factory
  const factory721 = await deployer.deploy(ERC721RaribleFactoryC2, beacon721Minimal.address, transferProxy, erc721LazyMintTransferProxy, { gas: 2500000 * getGasMultiplier(network) });
  console.log(`deployed factory721 minimal at ${factory721.address}`)
}
