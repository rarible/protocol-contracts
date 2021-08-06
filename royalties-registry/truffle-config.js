const os = require('os');
const trezorProvider = require("@rarible/trezor-provider");
const createTrezorProvider = trezorProvider.createProvider;
const Web3ProviderEngine = require("web3-provider-engine");

Web3ProviderEngine.prototype.send = Web3ProviderEngine.prototype.sendAsync;

let apiKey;
try {
	console.log(`Loading etherscan key from ${os.homedir() + "/.ethereum/etherscan.json"}`);
	apiKey = require(os.homedir() + "/.ethereum/etherscan.json").apiKey;
	console.log("loaded etherscan api key");
} catch {
	console.log("unable to load etherscan key from config")
	apiKey = "UNKNOWN"
}

function createNetwork(name) {
  try {
    var json = require(os.homedir() + "/.ethereum/" + name + ".json");
    var gasPrice = json.gasPrice != null ? json.gasPrice : 2000000000;

    return {
      provider: () => {
      	if (json.path != null) {
      		return createTrezorProvider({url: json.url, path: json.path, chainId: json.network_id});
      	} else {
      		return createProvider(json.address, json.key, json.url);
      	}
      },
      gas: 4500000,
      gasPrice: gasPrice + "000000000",
      network_id: json.network_id,
      skipDryRun: true,
      networkCheckTimeout: 500000
    };
  } catch (e) {
    return null;
  }
}

function createProvider(address, key, url) {
  console.log("creating provider for address: " + address);
  var HDWalletProvider = require("@truffle/hdwallet-provider");
  return new HDWalletProvider(key, url);
}

module.exports = {
	api_keys: {
      etherscan: apiKey
  },

	plugins: [
    'truffle-plugin-verify'
  ],

  networks: {
    e2e: createNetwork("e2e"),
    ops: createNetwork("ops"),
    ropsten: createNetwork("ropsten"),
    mainnet: createNetwork("mainnet"),
    rinkeby: createNetwork("rinkeby"),
    rinkeby2: createNetwork("rinkeby2")
  },

  compilers: {
    solc: {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled : true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  }
}
