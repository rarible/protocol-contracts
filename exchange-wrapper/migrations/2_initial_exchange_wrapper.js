const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const RaribleExchangeWrapper = artifacts.require('RaribleExchangeWrapper');

const rinkeby = {
  exchangeV2: "0xd4a57a3bD3657D0d46B4C5bAC12b3F156B9B886b",
  wyvernExchange: "0xdD54D660178B28f6033a953b0E55073cFA7e3744",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000", // is there x2y2 on rinkeby?
  looksRare: "0x1AA777972073Ff66DCFDeD85749bDD555C0665dA",
  sudoSwap: "0x9ABDe410D7BA62fA11EF37984c0Faf2782FE39B5"
}
const mainnet = {
  exchangeV2: "0x9757F2d2b135150BBeb65308D4a91804107cd8D6",
  wyvernExchange: "0x7f268357A8c2552623316e2562D90e642bB538E5",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
  sudoSwap: "0x0000000000000000000000000000000000000000"
}

const def = {
  exchangeV2: "0x0000000000000000000000000000000000000000",
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000"
}

const dev = {
  exchangeV2: "0x0000000000000000000000000000000000000000",
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
  "mainnet": mainnet,
  "mainnet-fork": mainnet,
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

  await deployer.deploy(RaribleExchangeWrapper, settings.wyvernExchange, settings.exchangeV2, settings.seaPort, settings.x2y2,  settings.looksRare, settings.sudoSwap, { gas: 3000000 });

  exchangeWrapper = await RaribleExchangeWrapper.deployed()

  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
};