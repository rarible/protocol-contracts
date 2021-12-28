const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const AssetMatcherCollection = artifacts.require('AssetMatcherCollection');
const ExchangeV2 = artifacts.require('ExchangeV2');
const { id } = require("./config.js");

module.exports = async function (deployer) {
  const ex = await ExchangeV2.deployed();
  await deployer.deploy(AssetMatcherCollection, { gas: 1000000 });
  const matcher = await AssetMatcherCollection.deployed();
  await matcher.__AssetMatcherCollection_init();
  await matcher.addOperator(ex.address);
  await ex.setAssetMatcher(id("COLLECTION"), matcher.address);
};