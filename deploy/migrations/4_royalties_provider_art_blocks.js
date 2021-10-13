const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderArtBlocks = artifacts.require("RoyaltiesProviderArtBlocks");

const getSettings = require("./config.js")

module.exports = async function (deployer, network) {
  const settings = getSettings(network).artBlocks;
  const royaltiesRegistry = await RoyaltiesRegistry.deployed();
  await setArtBlocksProvider(deployer, network, royaltiesRegistry, settings)
};

// sets royalties Provider for v2 legacy royalty
async function setArtBlocksProvider(deployer, network, royaltiesRegistry, settings) {
  // can't deploy without token address
  if (!settings || !settings.tokens || settings.tokens.length == 0) {
    return;
  }

  //can't deploy without artblocksAddress
  if (!settings.artblocksAddress || settings.artblocksAddress == "") {
    console.log(`artblocksAddress not set on network ${network} for tokens :${settings.tokens}`)
    return;
  }

  const providerArtBlocks = await deployer.deploy(RoyaltiesProviderArtBlocks, { gas: 1000000 });
  console.log("deployed providerArtBlocks", providerArtBlocks.address)
  await providerArtBlocks.transferOwnership(settings.artblocksAddress, { gas: 150000 });

  console.log(`set artblocksAddress ${await providerArtBlocks.owner()}`)
  for (const token of settings.tokens) {
    await royaltiesRegistry.setProviderByToken(token, providerArtBlocks.address, { gas: 100000 });

    console.log(`set royalties royaltiesProviderArtBlocks ${await royaltiesRegistry.royaltiesProviders(token)} for token ${token}`)
  }
}