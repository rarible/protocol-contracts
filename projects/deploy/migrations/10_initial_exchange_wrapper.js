const RaribleExchangeWrapper = artifacts.require('RaribleExchangeWrapper');
const ExchangeV2 = artifacts.require('ExchangeV2');
const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const WETH9 = artifacts.require('WETH9');

const { getSettings, getGasMultiplier } = require("./config.js")

const zeroAddress = "0x0000000000000000000000000000000000000000"
const mainnet = {
  marketplaces: [
    "0x7f268357A8c2552623316e2562D90e642bB538E5", // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    "0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3", // x2y2
    "0x59728544B08AB483533076417FbBB2fD0B17CE3a", // looksRare
    "0x2b2e8cda09bba9660dca5cb6233787738ad68329", // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    "0x0000000000e655fae4d56241588680f86e3b2377", // looksRareV2
    "0x000000000000Ad05Ccc4F10045630fb830B95127", // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

  weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  transferProxies: [],
}
const polygon_mainnet = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbef3e08e8df289169ede581", // seaPort_1_1
    zeroAddress, // x2y2
    zeroAddress, // looksRare
    zeroAddress, // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    zeroAddress, // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

  weth: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  transferProxies: [],
}
const goerli = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    zeroAddress, // x2y2
    "0xD112466471b5438C1ca2D218694200e49d81D047", // looksRare
    "0x25b4EfC43c9dCAe134233CD577fFca7CfAd6748F", // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    "0x35C2215F2FFe8917B06454eEEaba189877F200cf", // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

  weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  transferProxies: [],
}
const def = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    zeroAddress, // x2y2
    zeroAddress, // looksRare
    zeroAddress, // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    zeroAddress, // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
    zeroAddress, // seaport_1_6 @dev ensure a working seaport_1_6 is not needed for proper truffle tests functionality.
  ],

  weth: zeroAddress,
  transferProxies: [],
}

const dev = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    zeroAddress, // x2y2
    zeroAddress, // looksRare
    "0xc64E5D291CaEdF42b77fa9E50d5Fd46113227857", // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    zeroAddress, // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

  weth: zeroAddress,
  transferProxies: [],
}

const staging = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    zeroAddress, // x2y2
    zeroAddress, // looksRare
    "0xE27A07e9B293dC677e34aB5fF726073ECbeCA842", // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    zeroAddress, // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

  weth: zeroAddress,
  transferProxies: [],
}

const polygon_staging = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    zeroAddress, // x2y2
    zeroAddress, // looksRare
    "0x55eB2809896aB7414706AaCDde63e3BBb26e0BC6", // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    zeroAddress, // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

  weth: zeroAddress,
  transferProxies: [],
}

const polygon_mumbai = {
  marketplaces: [
    zeroAddress, // wyvernExchange
    "", //rarible exchangeV2 palceholder
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // seaPort_1_1
    zeroAddress, // x2y2
    zeroAddress, // looksRare
    zeroAddress, // sudoSwap
    "0x00000000000001ad428e4906aE43D8F9852d0dD6", // seaport_1_4
    zeroAddress, // looksRareV2
    zeroAddress, // blur
    "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // seaport_1_5
  ],

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
  "polygon_mumbai": polygon_mumbai,
  "polygon_mainnet": polygon_mainnet
};

function getWrapperSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return settings["default"];
  }
}

module.exports = async function (deployer, network, accounts) {
  const deployerAddress = accounts[0];
  
  const { deploy_meta, deploy_non_meta } = getSettings(network);

  let exchangeV2;
   if (!!deploy_meta) {
    exchangeV2 = (await ExchangeMetaV2.deployed()).address;
  } 

  if (!!deploy_non_meta){
    exchangeV2 = (await ExchangeV2.deployed()).address;
  }

  let settings = getWrapperSettings(network);
  settings.marketplaces[1] = exchangeV2;

  if (settings.weth === zeroAddress) {
    try {
      settings.weth = (await WETH9.deployed()).address
    } catch (error) {
      console.log(`using zero address WETH for exchangeWrapper`)
    }
  }

  const erc20TransferProxy = await ERC20TransferProxy.deployed();
  settings.transferProxies.push(erc20TransferProxy.address)

  if (network === "polygon_mainnet") {
    await deployer.deploy(RaribleExchangeWrapper, settings.marketplaces, settings.weth, settings.transferProxies, deployerAddress, { gas: 4500000 * getGasMultiplier(network), nonce: 141 });
  } else {
    await deployer.deploy(RaribleExchangeWrapper, settings.marketplaces, settings.weth, settings.transferProxies, deployerAddress, { gas: 4500000 * getGasMultiplier(network) });
  }
  

  const exchangeWrapper = await RaribleExchangeWrapper.deployed()
  console.log("Deployed contract exchangeWrapper at:", exchangeWrapper.address)
  console.log("With settings:", settings)
};
