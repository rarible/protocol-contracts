const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeWrapper = artifacts.require('ExchangeWrapper');

module.exports = async function (deployer, network) {

  const existing = await ExchangeWrapper.deployed();
  await upgradeProxy(existing.address, ExchangeWrapper, { deployer });

};
