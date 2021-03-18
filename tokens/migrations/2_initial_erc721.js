const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721Rarible = artifacts.require('ERC721Rarible');

module.exports = async function (deployer) {
  await deployProxy(ERC721Rarible, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC721Rarible_init' });
};