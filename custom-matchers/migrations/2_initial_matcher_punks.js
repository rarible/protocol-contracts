const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AssetMatcherPunk = artifacts.require('AssetMatcherPunk');

module.exports = async function (deployer) {
  await deployer.deploy(AssetMatcherPunk, { gas: 1500000 });
};