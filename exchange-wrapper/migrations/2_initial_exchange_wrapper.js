const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeWrapper = artifacts.require('ExchangeWrapper');

//TODO set real addresses
const rinkeby = {
	exchangeV2:     "0x0000000000000000000000000000000000000000",
	wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const mainnet = {
	exchangeV2: "0x0000000000000000000000000000000000000000",
	wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const ropsten = {
	exchangeV2: "0x0000000000000000000000000000000000000000",
	wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const e2e = {
	exchangeV2: "0x0000000000000000000000000000000000000000",
	wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const def = {
	exchangeV2: "0x0000000000000000000000000000000000000000",
	wyvernExchange: "0x0000000000000000000000000000000000000000"
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
  const settings = getSettings(network);

	await deployer.deploy(ExchangeWrapper, { gas: 1500000 });
	const exchangeWrapper = await ExchangeWrapper.deployed();
	await exchangeWrapper.__ExchangeBulkV2_init(settings.wyvernExchange, settings.exchangeV2, { gas: 200000 });
	console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
};