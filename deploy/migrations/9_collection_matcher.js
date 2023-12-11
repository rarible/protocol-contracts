const AssetMatcherCollection = artifacts.require('AssetMatcherCollection');
const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

const { id, getSettings, getGasMultiplier } = require("./config.js");

module.exports = async function (deployer, network) {
  //deploy asset matcher for collections
  await deployer.deploy(AssetMatcherCollection, { gas: 1000000 * getGasMultiplier(network) });
  const matcher = await AssetMatcherCollection.deployed();
  console.log("asset matcher for collections deployed at", matcher.address)

  // set it in ExchangeV2
  const settings = getSettings(network);
  if (!!settings.deploy_meta) {
    const exchangeV2 = await ExchangeMetaV2.deployed();
    await exchangeV2.setAssetMatcher(id("COLLECTION"), matcher.address);
  } 
  
  if (!!settings.deploy_non_meta) {
    const exchangeV2 = await ExchangeV2.deployed();
    await exchangeV2.setAssetMatcher(id("COLLECTION"), matcher.address);
  }
  
};