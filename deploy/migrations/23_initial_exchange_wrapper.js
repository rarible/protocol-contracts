const ExchangeWrapper = artifacts.require('ExchangeWrapper');
const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

const { getSettings } = require("./config.js")


const rinkeby = {
  wyvernExchange: "0xdD54D660178B28f6033a953b0E55073cFA7e3744",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000"
}
const mainnet = {
  wyvernExchange: "0x7f268357A8c2552623316e2562D90e642bB538E5",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3",
  looksRare: "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
  sudoSwap: "0x2b2e8cda09bba9660dca5cb6233787738ad68329"
}
const goerli = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0xD112466471b5438C1ca2D218694200e49d81D047",
  sudoSwap: "0x2b2e8cda09bba9660dca5cb6233787738ad68329"
}
const ropsten = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000"
}
const e2e = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000"
}
const def = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000"
}

const dev = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000"
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
  "goerli": goerli,
  "dev": dev
};

function getWrapperSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return settings["default"];
  }
}

module.exports = async function (deployer, network) {
  const settings = getWrapperSettings(network);
  let exchangeWrapper;

  const { deploy_meta, deploy_non_meta } = getSettings(network);

  let exchangeV2;
   if (!!deploy_meta) {
    exchangeV2 = (await ExchangeMetaV2.deployed()).address;
  } 

  if (!!deploy_non_meta){
    exchangeV2 = (await ExchangeV2.deployed()).address;
  }

  await deployer.deploy(ExchangeWrapper, settings.wyvernExchange, exchangeV2, settings.seaPort, settings.x2y2,  settings.looksRare, settings.sudoSwap, { gas: 3000000 });

  exchangeWrapper = await ExchangeWrapper.deployed()
  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
  console.log("With settings:", settings)
};