const RaribleExchangeWrapper = artifacts.require('RaribleExchangeWrapper');
const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');

const { getSettings } = require("./config.js")

const mainnet = {
  wyvernExchange: "0x7f268357A8c2552623316e2562D90e642bB538E5",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3",
  looksRare: "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
  sudoSwap: "0x2b2e8cda09bba9660dca5cb6233787738ad68329",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  transferProxies: [],
}
const goerli = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0xD112466471b5438C1ca2D218694200e49d81D047",
  sudoSwap: "0x25b4EfC43c9dCAe134233CD577fFca7CfAd6748F",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  transferProxies: [],
}
const def = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0x0000000000000000000000000000000000000000",
  transferProxies: [],
}

const dev = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0xc64E5D291CaEdF42b77fa9E50d5Fd46113227857",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0x0000000000000000000000000000000000000000",
  transferProxies: [],
}

const staging = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0xE27A07e9B293dC677e34aB5fF726073ECbeCA842",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0x0000000000000000000000000000000000000000",
  transferProxies: [],
}

const polygon_staging = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x55eB2809896aB7414706AaCDde63e3BBb26e0BC6",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0x0000000000000000000000000000000000000000",
  transferProxies: [],
}

const polygon_mumbai = {
  wyvernExchange: "0x0000000000000000000000000000000000000000",
  seaPort_1_1: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  x2y2: "0x0000000000000000000000000000000000000000",
  looksRare: "0x0000000000000000000000000000000000000000",
  sudoSwap: "0x0000000000000000000000000000000000000000",
  seaport_1_4: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
  weth: "0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa",
  transferProxies: [],
}

let settings = {
  "default": def,
  "mainnet": mainnet,
  "mainnet-fork": mainnet,
  "goerli": goerli,
  "dev": dev,
  "staging": staging,
  "polygon_staging": polygon_staging,
  "polygon_mumbai": polygon_mumbai
};

function getWrapperSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return settings["default"];
  }
}

module.exports = async function (deployer, network) {
  let settings = getWrapperSettings(network);
  let exchangeWrapper;

  const { deploy_meta, deploy_non_meta } = getSettings(network);

  let exchangeV2;
   if (!!deploy_meta) {
    exchangeV2 = (await ExchangeMetaV2.deployed()).address;
  } 

  if (!!deploy_non_meta){
    exchangeV2 = (await ExchangeV2.deployed()).address;
  }

  const erc20TransferProxy = await ERC20TransferProxy.deployed();
  settings.transferProxies.push(erc20TransferProxy.address)
  settings.transferProxies.push(settings.seaport_1_4)
  settings.transferProxies.push(settings.seaPort_1_1)

  await deployer.deploy(RaribleExchangeWrapper, settings.wyvernExchange, exchangeV2, settings.seaPort_1_1, settings.x2y2,  settings.looksRare, settings.sudoSwap, settings.seaport_1_4, settings.weth, settings.transferProxies, { gas: 4000000 });

  exchangeWrapper = await RaribleExchangeWrapper.deployed()
  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
  console.log("With settings:", settings)
};