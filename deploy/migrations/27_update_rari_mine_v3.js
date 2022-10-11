const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const RariMineV3 = artifacts.require("RariMineV3");

module.exports = async function (deployer, network) {

  const existing = await RariMineV3.deployed();
  await upgradeProxy(existing.address, RariMineV3, { deployer });

};
