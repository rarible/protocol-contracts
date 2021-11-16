const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721Rarible = artifacts.require('ERC721Rarible');

module.exports = async function (deployer, network) {
  //upgrade old 721 proxy
  const erc721Proxy = await ERC721Rarible.deployed();
  await upgradeProxy(erc721Proxy.address, ERC721Rarible, { deployer });
};
