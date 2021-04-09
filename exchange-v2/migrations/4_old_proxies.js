const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const TransferProxy = artifacts.require('TransferProxy');
const ExchangeV2 = artifacts.require('ExchangeV2');

module.exports = async function (deployer) {
  const tp = await TransferProxy.deployed();
  const erc20tp = await ERC20TransferProxy.deployed();

  const ex = await ExchangeV2.deployed();
  await tp.addOperator(ex.address);
  await erc20tp.addOperator(ex.address);
};
