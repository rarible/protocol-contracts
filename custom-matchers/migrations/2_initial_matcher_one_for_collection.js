const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AssetMatcherCollection = artifacts.require('AssetMatcherCollection');

module.exports = async function (deployer) {
  await deployer.deploy(AssetMatcherCollection, { gas: 1500000 });
};