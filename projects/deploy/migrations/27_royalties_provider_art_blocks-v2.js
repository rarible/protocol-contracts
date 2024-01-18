const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderArtBlocksV2 = artifacts.require("RoyaltiesProviderArtBlocksV2");

const {getSettings} = require("./config.js")

module.exports = async function (deployer, network) {
  const settings = getSettings(network);
  const royaltiesRegistry = await RoyaltiesRegistry.deployed();
  
  if ((!!settings.deployArtblockV2Provider) && (settings.artBlocksV2Collections.length > 0)) {
    const providerArtBlocksV2 = await deployer.deploy(RoyaltiesProviderArtBlocksV2, { gas: 1000000 });
    console.log("deployed providerArtBlocksV2", providerArtBlocksV2.address)

    for (const token of settings.artBlocksV2Collections) {
      await royaltiesRegistry.setProviderByToken(token, providerArtBlocksV2.address, { gas: 100000 });

      console.log(`set royalties royaltiesProviderArtBlocksV2 ${await royaltiesRegistry.getProvider(token)} for token ${token}`)
    }
  }
};
