const PunkTransferProxy = artifacts.require('PunkTransferProxy');
const IExchangeV2 = artifacts.require('IExchangeV2');

const { CRYPTO_PUNKS } = require("../assets");

const rinkeby = {
	exchangeV2: "0xd4a57a3bD3657D0d46B4C5bAC12b3F156B9B886b",
}
const mainnet = {
	exchangeV2: "0x9757F2d2b135150BBeb65308D4a91804107cd8D6",
}
const ropsten = {
	exchangeV2: "0x33Aef288C093Bf7b36fBe15c3190e616a993b0AD",
}
const e2e = {
	exchangeV2: "",
}
const def = {
	exchangeV2: "",
}

let settings = {
	"default": def,
	"rinkeby": rinkeby,
	"rinkeby-fork": rinkeby,
	"ropsten": ropsten,
	"ropsten-fork": ropsten,
	"mainnet": mainnet,
	"mainnet-fork": mainnet,
	"e2e": e2e,
	"e2e-fork": e2e
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network) {
	await deployer.deploy(PunkTransferProxy, { gas: 1500000 });
	const punkTransferProxy = await PunkTransferProxy.deployed();
	await punkTransferProxy.__OperatorRole_init({ gas: 200000 });
  console.log("punk transfer proxy deployed at", punkTransferProxy.address)

  const settings = getSettings(network)

  if (!settings || !settings.exchangeV2){
    return;
  }

  // setting proxy in exchange v2 for assetType = CRYPTO_PUNKS
  const ExchangeV2 = await IExchangeV2.at(settings.exchangeV2)
  await ExchangeV2.setTransferProxy(CRYPTO_PUNKS, punkTransferProxy.address)

  // setting exchangev2 as operator in proxy contract
  await punkTransferProxy.addOperator(ExchangeV2.address)

};