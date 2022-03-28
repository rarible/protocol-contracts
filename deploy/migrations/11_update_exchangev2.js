const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const { getSettings } = require("./config.js")

const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

module.exports = async function (deployer, network) {
  const { meta_support } = getSettings(network);
  let exchangeV2toDeploy;
  if (!!meta_support) {
    exchangeV2toDeploy = ExchangeMetaV2;
  } else {
    exchangeV2toDeploy = ExchangeV2;
  }

  const existing = await exchangeV2toDeploy.deployed();
  await upgradeProxy(existing.address, exchangeV2toDeploy, { deployer });
};