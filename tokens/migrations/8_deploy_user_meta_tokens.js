const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');


module.exports = async function (deployer) {
  await deployProxy(ERC721RaribleMeta, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC721RaribleMeta_init' });
  await deployProxy(ERC1155RaribleMeta, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC1155RaribleMeta_init' });

};