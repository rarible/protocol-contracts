
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AuctionHouse721 = artifacts.require('AuctionHouse721');
const AuctionHouse1155 = artifacts.require('AuctionHouse1155');
const Wrapper = artifacts.require('Wrapper');

const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const TransferProxy = artifacts.require('TransferProxy');

const { getSettings } = require("./config.js")

module.exports = async function (deployer, network) {
  const { communityWallet } = getSettings(network);

  const transferProxy = (await TransferProxy.deployed()).address;
  const erc20TransferProxy = (await ERC20TransferProxy.deployed()).address;
  const royaltiesRegistry = (await RoyaltiesRegistry.deployed()).address;

  const auction721 = await deployProxy(
    AuctionHouse721,
    [communityWallet, royaltiesRegistry,  transferProxy, erc20TransferProxy,  0, 100],
    { deployer, initializer: '__AuctionHouse721_init' }
  );
  console.log(`deployed auction 721 at ${auction721.address}`)

  const auction1155 = await deployProxy(
    AuctionHouse1155,
    [communityWallet, royaltiesRegistry,  transferProxy, erc20TransferProxy,  0, 100],
    { deployer, initializer: '__AuctionHouse1155_init'}
  );
  console.log(`deployed auction 1155 at ${auction1155.address}`)

  // setting auction as operator in transferProxy
  const TransferProxyContract = await TransferProxy.at(transferProxy);
  //not needed in normal migration
  await TransferProxyContract.addOperator(auction721.address)
  await TransferProxyContract.addOperator(auction1155.address)

  // setting auction as operator in erc20 transferProxy
  const ERC20TransferProxyContract = await ERC20TransferProxy.at(erc20TransferProxy);
  //not needed in normal migration
  await ERC20TransferProxyContract.addOperator(auction721.address) 
  await ERC20TransferProxyContract.addOperator(auction1155.address) 

  //deploying wrapper
  await deployer.deploy(Wrapper, auction721.address);
  const wrapper = await Wrapper.deployed();
  console.log(`deployed wrapper at ${wrapper.address}`)

  /*
  //setting minimal auction duration to 0 at e2e network
  if (network === "e2e") {
    await auction721.changeMinimalDuration(0)
    await auction1155.changeMinimalDuration(0)
    console.log(`changed minimal auction duration to ${await auction721.minimalDuration()}`)
  }
  */

};
