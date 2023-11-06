const WETH9 = artifacts.require('WETH9');

const { getSettings, getGasMultiplier } = require("./config.js")

module.exports = async function (deployer, network) {
  const { deploy_WETH } = getSettings(network);

  if (!!deploy_WETH) {
    await deployer.deploy(WETH9, { gas: 1500000 * getGasMultiplier(network) });
    const weth = await WETH9.deployed();
    console.log("WETH deployed at", weth.address)
  }
};