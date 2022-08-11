const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeWrapper = artifacts.require('ExchangeWrapper');
const ExchangeV2 = artifacts.require('ExchangeV2');

const rinkeby = {
  wyvernExchange: "0xdD54D660178B28f6033a953b0E55073cFA7e3744",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000"
}
const mainnet = {
  wyvernExchange: "0x7f268357A8c2552623316e2562D90e642bB538E5",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000"
}
const ropsten = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000"
}
const e2e = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000"
}
const def = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000"
}

const dev = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000"
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
  let exchangeWrapper;
  try {
    exchangeWrapper = await ExchangeWrapper.deployed();
    console.log("Found deployed wrapper contract. using it");
  } catch(e) {
    console.log("Deploying new exchange wrapper contract");
    await deployer.deploy(ExchangeWrapper, { gas: 5000000 });
    exchangeWrapper = await ExchangeWrapper.deployed();
  }
  const exchangeV2 = (await ExchangeV2.deployed()).address;
  await exchangeWrapper.__ExchangeWrapper_init(settings.wyvernExchange, exchangeV2, settings.seaPort, settings.x2y2,  settings.looksRare, { gas: 200000 });
  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
};