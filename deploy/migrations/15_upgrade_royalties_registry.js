const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');

module.exports = async function (deployer) {
  const existing = await RoyaltiesRegistry.deployed();
  await upgradeProxy(existing.address, RoyaltiesRegistry, { deployer });
};