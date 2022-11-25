const TestERC20 = artifacts.require('TestERC20');

const { getSettings } = require("./config.js")

module.exports = async function (deployer, network) {
  const { deploy_test_erc20 } = getSettings(network);

  if (!!deploy_test_erc20) {
    await deployer.deploy(TestERC20, { gas: 1500000 });
    const testerc20 = await TestERC20.deployed();
    console.log("test erc20 deployed on", network ,"at:", testerc20.address)
  }
};