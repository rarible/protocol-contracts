
const rinkeby = {
  v2Legacy: ["0x0A093d230ba7845BcA0898851B093B8B19bc1Ae1"],
  artBlocks: {
    tokens: [
      "0x152eeE3DCc5526efd646E9b45c9a9672BfFcc097"
    ],
    artblocksAddress: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4"
  },
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
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
}
const ropsten = {
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
}
const e2e = {
  communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
}
const polygon_mumbai = {
  communityWallet: "0x0CA38eAc26A4D0F17F7f323189282e2c0d8259bD",
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

module.exports = getSettings;