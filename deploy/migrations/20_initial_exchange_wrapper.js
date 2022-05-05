const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeWrapper = artifacts.require('ExchangeWrapper');
const ExchangeV2 = artifacts.require('ExchangeV2');

const rinkeby = {
  wyvernExchange: "0xdD54D660178B28f6033a953b0E55073cFA7e3744"
}
const mainnet = {
  wyvernExchange: "0x7f268357A8c2552623316e2562D90e642bB538E5"
}
const ropsten = {
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const e2e = {
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}
const def = {
  wyvernExchange: "0x0000000000000000000000000000000000000000"
}

const dev = {
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
  const exchangeV2 = await ExchangeV2.deployed();
  await exchangeWrapper.__ExchangeWrapper_init(settings.wyvernExchange, exchangeV2, { gas: 200000 });
  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
};