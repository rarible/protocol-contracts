const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const { getSettings } = require("./config.js")

const CryptoPunksMarket = artifacts.require('CryptoPunksMarket');
const PunkTransferProxy = artifacts.require('PunkTransferProxy');
const { CRYPTO_PUNK } = require("@rarible/exchange-v2/test/assets.js");

module.exports = async function (deployer, network) {
  const settings = getSettings(network);
  console.log(settings)
  let addressCryptoPunksMarket;
  if (settings.deploy_CryptoPunks) {
    const cryptoPunksMarket = await deployProxy(
      CryptoPunksMarket, [], { deployer, initializer: 'CryptoPunksMarket()' }
    );
    addressCryptoPunksMarket = cryptoPunksMarket.address;
  } else {
    addressCryptoPunksMarket = settings.address_CryptoPunks;
  }
  console.log("deployed cryptoPunksMarket at", addressCryptoPunksMarket);

  await deployer.deploy(PunkTransferProxy, { gas: 1500000 });
  const punkTransferProxy = await PunkTransferProxy.deployed();
  await punkTransferProxy.__OperatorRole_init({ gas: 200000 });

  const exchangeV2 = (await ExchangeV2.deployed()).address;
  await punkTransferProxy.addOperator(exchangeV2);

  await exchangeV2.setTransferProxy(CRYPTO_PUNK, punkTransferProxy.address);
};