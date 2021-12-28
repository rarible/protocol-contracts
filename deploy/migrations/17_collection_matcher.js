const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const AssetMatcherCollection = artifacts.require('AssetMatcherCollection');
const ExchangeV2 = artifacts.require('ExchangeV2');
const { id } = require("./config.js");

module.exports = async function (deployer) {
  //deploy asset matcher for collections
  await deployer.deploy(AssetMatcherCollection, { gas: 1000000 });
  const matcher = await AssetMatcherCollection.deployed();
  console.log("asset matcher for collections deployed at", matcher.address)

  // set it in ExchangeV2
  const ex = await ExchangeV2.deployed();
  await ex.setAssetMatcher(id("COLLECTION"), matcher.address);
};