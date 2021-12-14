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
}
const ropsten = {
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
  deploy_CryptoPunks: true,
  address_ownerTestCryptoPunks: "0x6751c1ebdc4ab4e5cb103d5ceb84d26963a3377e",
}
const e2e = {
  communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  deploy_CryptoPunks: true,
  address_ownerTestCryptoPunks: "0xc66d094ed928f7840a6b0d373c1cd825c97e3c7c",
}
const polygon_mumbai = {
  communityWallet: "0x0CA38eAc26A4D0F17F7f323189282e2c0d8259bD",
  deploy_CryptoPunks: true,
  address_ownerTestCryptoPunks: "0x0CA38eAc26A4D0F17F7f323189282e2c0d8259bD",
}
const def = {
  communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  deploy_legacy: true,
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
  address_ownerTestCryptoPunks: "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
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
  "polygon_mumbai": polygon_mumbai
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

  let json;
  try {
    json = require(`../.openzeppelin/${network}.json`)
  } catch (e) {
    const tconfig = require('../truffle-config.js')
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

const ERC721_LAZY = id("ERC721_LAZY");
const ERC1155_LAZY = id("ERC1155_LAZY");

module.exports = { getSettings, getProxyImplementation, ERC721_LAZY, ERC1155_LAZY };