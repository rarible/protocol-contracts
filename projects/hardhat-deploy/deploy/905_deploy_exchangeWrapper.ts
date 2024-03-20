import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

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

const sepolia = {
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

  weth: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
  transferProxies: [],
}

let settings: any = {
  "default": def,
  "mainnet": mainnet,
  "mainnet-fork": mainnet,
  "goerli": goerli,
  "sepolia": sepolia,
  "dev": dev,
  "staging": staging,
  "polygon_staging": polygon_staging,
  "polygon_mumbai": polygon_mumbai,
  "polygon_mainnet": polygon_mainnet
};

function getWrapperSettings(network: string) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return settings["default"];
  }
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  let exchangeV2;
   if (!!deploy_meta) {
    exchangeV2 = (await hre.deployments.get("ExchangeMetaV2")).address;
  } 

  if (!!deploy_non_meta){
    exchangeV2 = (await hre.deployments.get("ExchangeV2")).address;
  }

  let settings = getWrapperSettings(hre.network.name);
  settings.marketplaces[1] = exchangeV2;
  
  if (settings.weth === zeroAddress) {
    console.log(`using zero address WETH for exchangeWrapper`)
  }

  const erc20TransferProxy = await hre.deployments.get("ERC20TransferProxy");
  settings.transferProxies.push(erc20TransferProxy.address)

  const deployment = await deploy('RaribleExchangeWrapper', {
    from: deployer,
    log: true,
    autoMine: true,
    args: [settings.marketplaces, settings.weth, settings.transferProxies]
  });
};

export default func;
func.tags = ['all', 'all-zk', 'wrapper', 'all-no-tokens', 'all-zk-no-tokens'];
