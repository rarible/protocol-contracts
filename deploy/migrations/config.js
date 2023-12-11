const ethUtil = require('ethereumjs-util');

const rinkeby = {
  v2Legacy: ["0x0A093d230ba7845BcA0898851B093B8B19bc1Ae1"],
  artBlocks: {
    tokens: [
      "0x152eeE3DCc5526efd646E9b45c9a9672BfFcc097"
    ],
    artblocksAddress: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4"
  },
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0xAf2584A8B198f5d0b360B95d92AEC852F7902e52",
  deploy_non_meta: true,
}
const mainnet = {
  v2Legacy: ["0x0A093d230ba7845BcA0898851B093B8B19bc1Ae1"],
  artBlocks: {
    tokens: [
      "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a",
      "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"
    ],
    artblocksAddress: "0x6C093Fe8bc59e1e0cAe2Ec10F0B717D3D182056B"
  },
  communityWallet: "0x1cf0df2a5a20cd61d68d4489eebbf85b8d39e18a",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
  deploy_non_meta: true,
  deployArtblockV2Provider: true,
  artBlocksV2Collections: [
    "0x99a9b7c1116f9ceeb1652de04d5969cce509b069",
    "0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a",
    "0xea698596b6009a622c3ed00dd5a8b5d1cae4fc36"
  ]
}
const ropsten = {
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
  deploy_CryptoPunks: true,
  deploy_non_meta: true,
}
const e2e = {
  communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  deploy_CryptoPunks: true,
  deploy_WETH: true,
  deploy_non_meta: true
}
const dev = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: true,
  deploy_WETH: true,
  deploy_non_meta: true,
  deploy_test_erc20: true
}
const staging = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: true,
  deploy_WETH: true,
  deploy_non_meta: true,
  deploy_test_erc20: true
}
const polygon_staging = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_WETH: true,
  deploy_meta: true,
  deploy_test_erc20: true
}
const polygon_mumbai = {
  communityWallet: "0x0CA38eAc26A4D0F17F7f323189282e2c0d8259bD",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
  deploy_test_erc20: true
}
const polygon_mainnet = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
}
const polygon_dev = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: true,
  deploy_meta: true,
  deploy_WETH: true,
  deploy_test_erc20: true
}
const def = {
  communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  deploy_legacy: false,
  beneficiary: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  buyerFeeSigner: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  "rarible_token_legacy": {
    name: "Rarible",
    symbol: "RARI",
    signer: "0x002ed05478c75974e08f0811517aa0e3eddc1380",
    contractURI: "https://api-e2e.rarible.com/contractMetadata/{address}",
    tokenURIPrefix: "ipfs://",
  },
  "mintable_token_legacy": {
    name: "Rarible",
    symbol: "RARI",
    newOwner: "0x002ed05478c75974e08f0811517aa0e3eddc1380",
    contractURI: "https://api-e2e.rarible.com/contractMetadata/{address}",
    tokenURIPrefix: "ipfs://",
  },
  deploy_CryptoPunks: true,
  deploy_meta: true,
  deploy_non_meta: true,
  deploy_WETH: true,
  deploy_test_erc20: true
}
const goerli = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: true,
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: true
}

const optimism_mainnet = {
  communityWallet: "0x1cf0df2a5a20cd61d68d4489eebbf85b8d39e18a",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: false
}

const optimism_goerli = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: true
}

const mantle_testnet = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_WETH: true,
  deploy_test_erc20: true
}

const mantle_mainnet = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true
}

const arbitrum_goerli = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: true
}

const chiliz_testnet = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: true,
}

const chiliz = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
}

const arbitrum_sepolia = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: true,
  deploymentGasMultiplier: 4
}

const arbitrum_mainnet = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploymentGasMultiplier: 8
}

const zkatana_testnet = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: false,
  deploy_non_meta: true,
  deploy_test_erc20: true,
}

const zkatana_mainnet = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
  deploy_non_meta: false,
}

const lightlink_pegasus = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
  deploy_non_meta: false,
}

const lightlink_phoenix = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
  deploy_non_meta: false,
}

const lightlink_pegasus = {
  communityWallet: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
  deploy_non_meta: true,
}

const lightlink_phoenix = {
  communityWallet: "0x424ACe4669579986D200eBeb3C75924282324a42",
  deploy_CryptoPunks: false,
  address_CryptoPunks: "0x0000000000000000000000000000000000000000",
  deploy_meta: true,
  deploy_non_meta: true,
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
  "polygon_mumbai": polygon_mumbai,
  "polygon_mainnet": polygon_mainnet,
  "dev": dev,
  "polygon_dev": polygon_dev,
  "goerli": goerli,
  "staging": staging,
  "polygon_staging": polygon_staging,
  "optimism_mainnet": optimism_mainnet,
  "optimism_goerli": optimism_goerli,
  "mantle_testnet": mantle_testnet,
  "mantle_mainnet": mantle_mainnet,
  "arbitrum_goerli": arbitrum_goerli,
  "arbitrum_sepolia": arbitrum_sepolia,
  "arbitrum_mainnet": arbitrum_mainnet,
  "chiliz_testnet": chiliz_testnet,
  "chiliz": chiliz,
  "zkatana_testnet": zkatana_testnet,
  "zkatana_mainnet": zkatana_mainnet,
  "lightlink_pegasus": lightlink_pegasus,
  "lightlink_phoenix": lightlink_phoenix,
};

function getSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return settings["default"];
  }
}

async function getProxyImplementation(proxy, network, ProxyAdmin) {
  if (network === "test") {
    network = "unknown-1337"
  }

  if (network === "e2e") {
    network = "unknown-17"
  }

  if (network === "dev") {
    network = "unknown-300500"
  }

  if (network === "polygon_dev") {
    network = "unknown-300501"
  }

  let json;
  try {
    json = require(`../.openzeppelin/${network}.json`)
  } catch (e) {
    const tconfig = require('../truffle-config.js')
    console.log(tconfig)
    const network_id = tconfig.networks[network].network_id;
    json = require(`../.openzeppelin/unknown-${network_id}.json`)
  }
  const c = await ProxyAdmin.at(json.admin.address)
  const deployed = await proxy.deployed()
  return c.getProxyImplementation(deployed.address)
}

function id(str) {
	return `0x${ethUtil.keccak256(str).toString("hex").substring(0, 8)}`;
}

async function updateImplementation(beacon, newImpl){
  const oldImpl = await beacon.implementation();
  if (oldImpl != newImpl){
    console.log(`old impl = ${oldImpl}`)
    await beacon.upgradeTo(newImpl, { gas: 200000 })
    console.log(`new impl = ${await beacon.implementation()}`)
  }
}

function getGasMultiplier(network) {
  const { deploymentGasMultiplier } = getSettings(network);
  if (!!deploymentGasMultiplier) {
    return deploymentGasMultiplier;
  }
  return 1;
}

const ERC721_LAZY = id("ERC721_LAZY");
const ERC1155_LAZY = id("ERC1155_LAZY");

module.exports = { getSettings, getProxyImplementation, ERC721_LAZY, ERC1155_LAZY, id, updateImplementation , getGasMultiplier};