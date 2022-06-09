const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeWrapper = artifacts.require('ExchangeWrapper');

//TODO set real addresses
const rinkeby = {
  exchangeV2:     "0xd4a57a3bD3657D0d46B4C5bAC12b3F156B9B886b",
  wyvernExchange: "0xdD54D660178B28f6033a953b0E55073cFA7e3744"
}
const mainnet = {
  exchangeV2: "0x9757F2d2b135150BBeb65308D4a91804107cd8D6",
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const ropsten = {
  exchangeV2: "0x33Aef288C093Bf7b36fBe15c3190e616a993b0AD",
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const e2e = {
  exchangeV2: "0x551E4009116d489e3C5a98405A9c4B601D250B58",
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const def = {
  exchangeV2: "0x0000000000000000000000000000000000000000",
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}

const dev = {
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
  "e2e-fork": e2e,
  "dev": dev
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
  await exchangeWrapper.__ExchangeWrapper_init(settings.wyvernExchange, settings.exchangeV2, { gas: 200000 });
  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
};