const CryptoPunksMarket = artifacts.require('CryptoPunksMarket');
const PunkTransferProxy = artifacts.require('PunkTransferProxy');
const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

const { getSettings, getGasMultiplier } = require("./config.js")
const { CRYPTO_PUNKS } = require("../../scripts/assets.js");

module.exports = async function (deployer, network) {
  const settings = getSettings(network);
  let cryptoPunksMarket;

  if (!settings.deploy_CryptoPunks && settings.address_CryptoPunks === "0x0000000000000000000000000000000000000000") {
    return;
  }

  if (settings.deploy_CryptoPunks) {
    await deployer.deploy(CryptoPunksMarket, { gas: 4500000 * getGasMultiplier(network) });
    cryptoPunksMarket = await CryptoPunksMarket.deployed();
  } else {
    cryptoPunksMarket = await CryptoPunksMarket.at(settings.address_CryptoPunks);
  }
  console.log("cryptoPunksMarket address: ",  cryptoPunksMarket.address);

  await deployer.deploy(PunkTransferProxy, { gas: 1500000 * getGasMultiplier(network) });
  const punkTransferProxy = await PunkTransferProxy.deployed();
  console.log("deployed punkTransferProxy: ", punkTransferProxy.address);
  await punkTransferProxy.__OperatorRole_init({ gas: 200000 });

  if (!!settings.deploy_meta) {
    const exchangeV2 = await ExchangeMetaV2.deployed();
    await punkTransferProxy.addOperator(exchangeV2.address);
    await exchangeV2.setTransferProxy(CRYPTO_PUNKS, punkTransferProxy.address);
  } 
  
  if (!!settings.deploy_non_meta) {
    const exchangeV2 = await ExchangeV2.deployed();
    await punkTransferProxy.addOperator(exchangeV2.address);
    await exchangeV2.setTransferProxy(CRYPTO_PUNKS, punkTransferProxy.address);
  }

  //await setTestCryptoPunks(settings.deploy_CryptoPunks, settings.address_ownerTestCryptoPunks, punkTransferProxy.address);
};

async function setTestCryptoPunks(_needDeploy, _owner, _punkTransferProxy) {
  if (_needDeploy) {
    const cryptoPunksMarket = await CryptoPunksMarket.deployed();
    await cryptoPunksMarket.allInitialOwnersAssigned();
    let punkIndex = 1;
    let punkNumber = 10;
    while (punkIndex <= punkNumber) {
      await cryptoPunksMarket.getPunk(punkIndex, { from: _owner });
      await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, _punkTransferProxy, { from: _owner });
      punkIndex++;
    }
  }
}