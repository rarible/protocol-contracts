const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC1155Rarible = artifacts.require('ERC1155Rarible');

module.exports = async function (deployer) {
  await deployProxy(ERC1155Rarible, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC1155Rarible_init' });
};