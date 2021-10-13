const os = require('os');

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
    var gasPrice = json.gasPrice != null ? json.gasPrice : 20;

    return {
      provider: () => createProvider(json.address, json.key, json.url),
      from: json.address,
      gas: 100000,
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
