const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const { getSettings } = require("./config.js")

const ExchangeV2 = artifacts.require('ExchangeV2');
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const TransferProxy = artifacts.require('TransferProxy');

const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

module.exports = async function (deployer, network) {
  const { communityWallet, meta_support } = getSettings(network);

  let exchangeV2toDeploy;
  //deploying ExchangeV2 with meta support if needed
  if (!!meta_support) {
    exchangeV2toDeploy = ExchangeMetaV2;
  } else {
    exchangeV2toDeploy = ExchangeV2;
  }

  const transferProxy = (await TransferProxy.deployed()).address;
  const erc20TransferProxy = (await ERC20TransferProxy.deployed()).address;
  const royaltiesRegistry = (await RoyaltiesRegistry.deployed()).address;

  const exchangeV2 = await deployProxy(
    exchangeV2toDeploy,
    [transferProxy, erc20TransferProxy, 0, communityWallet, royaltiesRegistry],
    { deployer, initializer: '__ExchangeV2_init' }
  );
  console.log("deployed exchangeV2 at", exchangeV2.address)
};