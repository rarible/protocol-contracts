const CryptoPunksMarket = artifacts.require('CryptoPunksMarket');
const PunkTransferProxy = artifacts.require('PunkTransferProxy');
const ExchangeV2 = artifacts.require('ExchangeV2');

const { getSettings } = require("./config.js")
const { CRYPTO_PUNKS } = require("@rarible/exchange-v2/test/assets.js");

module.exports = async function (deployer, network) {
  const settings = getSettings(network);
  let cryptoPunksMarket;

  if (settings.deploy_CryptoPunks) {
    await deployer.deploy(CryptoPunksMarket, { gas: 4500000 });
    cryptoPunksMarket = await CryptoPunksMarket.deployed();
  } else {
    cryptoPunksMarket = await CryptoPunksMarket.at(settings.address_CryptoPunks);
  }
  console.log("deployed cryptoPunksMarket:",  cryptoPunksMarket.address);

  await deployer.deploy(PunkTransferProxy, { gas: 1500000 });
  const punkTransferProxy = await PunkTransferProxy.deployed();
  console.log("PunkTransferProxy deployed: ", punkTransferProxy.address);
  await punkTransferProxy.__OperatorRole_init({ gas: 200000 });

  const exchangeV2 = await ExchangeV2.deployed();

  await punkTransferProxy.addOperator(exchangeV2.address);

  await exchangeV2.setTransferProxy(CRYPTO_PUNKS, punkTransferProxy.address);
  await setTestCryptoPunks(settings, punkTransferProxy.address);
};

async function setTestCryptoPunks(_settings, _punkTransferProxy) {
  if (_settings.deploy_CryptoPunks) {
    const cryptoPunksMarket = await CryptoPunksMarket.deployed();
    await cryptoPunksMarket.allInitialOwnersAssigned();
    let punkIndex = 1;
    let punkNumber = 10;
    while (punkIndex <= punkNumber) {
      await cryptoPunksMarket.getPunk(punkIndex, { from: _settings.address_ownerTestCryptoPunks });
      await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, _punkTransferProxy, { from: _settings.address_ownerTestCryptoPunks });
      punkIndex++;
    }
  }
}