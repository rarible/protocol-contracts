const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const AssetMatcherCollection = artifacts.require('AssetMatcherCollection');
const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

const { id, getSettings } = require("./config.js");

module.exports = async function (deployer, network) {
  //deploy asset matcher for collections
  await deployer.deploy(AssetMatcherCollection, { gas: 1000000 });
  const matcher = await AssetMatcherCollection.deployed();
  console.log("asset matcher for collections deployed at", matcher.address)

  // set it in ExchangeV2
  const { meta_support } = getSettings(network);
  let exchangeV2;
  if (!!meta_support) {
    exchangeV2 = await ExchangeMetaV2.deployed();
  } else {
    exchangeV2 = await ExchangeV2.deployed();
  }
  await exchangeV2.setAssetMatcher(id("COLLECTION"), matcher.address);
};