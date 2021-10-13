const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderV2Legacy = artifacts.require("RoyaltiesProviderV2Legacy");

const getSettings = require("./config.js")

module.exports = async function (deployer, network) {
  const settings = getSettings(network)
  const royaltiesRegistry = await RoyaltiesRegistry.deployed();

  await setV2LegacyProvider(deployer, royaltiesRegistry, settings)

};

// sets royalties Provider for v2 legacy royalty
async function setV2LegacyProvider(deployer, royaltiesRegistry, settings) {
  if (!settings.v2Legacy || settings.v2Legacy.length == 0) {
    return;
  }
  const providerV2Legacy = await RoyaltiesProviderV2Legacy.deployed().catch(() => deployer.deploy(RoyaltiesProviderV2Legacy, { gas: 500000 }));
  console.log("deployed providerV2Legacy at", providerV2Legacy.address)
  for (const token of settings.v2Legacy) {
    await royaltiesRegistry.setProviderByToken(token, providerV2Legacy.address, { gas: 100000 });
    console.log(`set royalties ProviderV2Legacy ${providerV2Legacy.address} for token ${token}`)
  }

}