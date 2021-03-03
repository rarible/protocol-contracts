function createNetwork(name) {
  var os = require('os');
  try {
    var json = require(os.homedir() + "/.ethereum/" + name + ".json");
    var gasPrice = json.gasPrice != null ? json.gasPrice : 2000000000;

    return {
      provider: () => createProvider(json.address, json.key, json.url),
      from: json.address,
      gas: 50000,
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

  networks: {
    e2e: createNetwork("e2e"),
    ops: createNetwork("ops"),
    ropsten: createNetwork("ropsten"),
    mainnet: createNetwork("mainnet"),
    rinkeby: createNetwork("rinkeby")
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
