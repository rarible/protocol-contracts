const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeV2 = artifacts.require('ExchangeV2');

module.exports = async function (deployer) {
  const existing = await ExchangeV2.deployed();
  await upgradeProxy(existing.address, ExchangeV2, { deployer });
};