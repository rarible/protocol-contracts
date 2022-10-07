const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const Staking = artifacts.require("Staking");

module.exports = async function (deployer, network) {

  const existing = await Staking.deployed();
  await upgradeProxy(existing.address, Staking, { deployer });

};
