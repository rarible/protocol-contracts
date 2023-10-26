const fs = require("fs");
const os = require('os');
const path = require('path');
require('dotenv').config();

function getConfigPath() {
  const configPath = process.env["NETWORK_CONFIG_PATH"];
  if (configPath) {
    return configPath;
  } else {
    return path.join(os.homedir(),  ".ethereum");
  }
}

function createNetwork(name) {
  try {
    var json = require(path.join(getConfigPath(), name + ".json"));
    var gasPrice = json.gasPrice != null ? json.gasPrice + "000000000" : 2000000000;
    return {
      provider: () => {
        const { estimate } = require("@rarible/estimate-middleware")
        if (json.path != null) {
          const { createProvider: createTrezorProvider } = require("@rarible/trezor-provider")
          const provider = createTrezorProvider({ url: json.url, path: json.path, chainId: json.network_id })
          provider.send = provider.sendAsync
          return provider
        } else {
          return createProvider(json.address, json.key, json.url)
        }
      },
      from: json.address,
      gas: 8000000,
      gasPrice: gasPrice,
      network_id: json.network_id,
      skipDryRun: true,
      networkCheckTimeout: 500000
    };
  } catch (e) {
    return null;
  }
}

function createNetworkMantelTest(name) {
  try {
    var json = require(path.join(getConfigPath(), name + ".json"));
    // for mantle_tesnet we use wei
    // for all other networks we use gwei
    var gasPrice = name.startsWith("mantle") ? (json.gasPrice) : (json.gasPrice != null ? json.gasPrice : 2000000000);
    return {
      provider: () => {
        const { estimate } = require("@rarible/estimate-middleware")
        if (json.path != null) {
          const { createProvider: createTrezorProvider } = require("@rarible/trezor-provider")
          const provider = createTrezorProvider({ url: json.url, path: json.path, chainId: json.network_id })
          provider.send = provider.sendAsync
          return provider
        } else {
          return createProvider(json.address, json.key, json.url)
        }
      },
      from: json.address,
      gas: 8000000,
      gasPrice: gasPrice,
      network_id: json.network_id,
      skipDryRun: true,
      networkCheckTimeout: 500000,
      verify: {
        apiUrl: 'https://explorer.testnet.mantle.xyz/api',
        apiKey: 'xyz',
        explorerUrl: 'https://explorer.testnet.mantle.xyz',
      }
    };
  } catch (e) {
    return null;
  }
}

function createNetworkZKatanaTest(name) {
  try {
    var json = require(path.join(getConfigPath(), name + ".json"));
    // for mantle_tesnet we use wei
    // for all other networks we use gwei
    var gasPrice = json.gasPrice
    return {
      provider: () => {
        const { estimate } = require("@rarible/estimate-middleware")
        if (json.path != null) {
          const { createProvider: createTrezorProvider } = require("@rarible/trezor-provider")
          const provider = createTrezorProvider({ url: json.url, path: json.path, chainId: json.network_id })
          provider.send = provider.sendAsync
          return provider
        } else {
          return createProvider(json.address, json.key, json.url)
        }
      },
      from: json.address,
      gas: 8000000,
      gasPrice: gasPrice,
      network_id: json.network_id,
      skipDryRun: true,
      networkCheckTimeout: 500000,
      verify: {
        apiUrl: 'https://zkatana.blockscout.com/api',
        apiKey: '92600277-9ba3-45d2-8034-cc11f01aa8f3',
        explorerUrl: 'https://zkatana.blockscout.com'
      }
    };
  } catch (e) {
    return null;
  }
}

function createNetworkArbitrumSepolia(name) {
  try {
    var json = require(path.join(getConfigPath(), name + ".json"));
    var gasPrice = json.gasPrice != null ? json.gasPrice + "000000000" : 2000000000;
    return {
      provider: () => {
        const { estimate } = require("@rarible/estimate-middleware")
        if (json.path != null) {
          const { createProvider: createTrezorProvider } = require("@rarible/trezor-provider")
          const provider = createTrezorProvider({ url: json.url, path: json.path, chainId: json.network_id })
          provider.send = provider.sendAsync
          return provider
        } else {
          return createProvider(json.address, json.key, json.url)
        }
      },
      from: json.address,
      gas: 8000000,
      gasPrice: gasPrice,
      network_id: json.network_id,
      skipDryRun: true,
      networkCheckTimeout: 500000,
      verify: {
        apiUrl: 'https://sepolia.arbiscan.io/api',
        apiKey: 'UUP13U6I3JYQVCK4UHK5TM3RX9765IYKSR',
        explorerUrl: 'https://sepolia.arbiscan.io/'
      }
    };
  } catch (e) {
    return null;
  }
}
    
function createNetworkChilizTestnet(name) {
  try {
    var json = require(path.join(getConfigPath(), name + ".json"));
    // for mantle_tesnet we use wei
    // for all other networks we use gwei
    var gasPrice = json.gasPrice
    return {
      provider: () => {
        const { estimate } = require("@rarible/estimate-middleware")
        if (json.path != null) {
          const { createProvider: createTrezorProvider } = require("@rarible/trezor-provider")
          const provider = createTrezorProvider({ url: json.url, path: json.path, chainId: json.network_id })
          provider.send = provider.sendAsync
          return provider
        } else {
          return createProvider(json.address, json.key, json.url)
        }
      },
      from: json.address,
      gas: 8000000,
      gasPrice: gasPrice,
      network_id: json.network_id,
      skipDryRun: true,
      networkCheckTimeout: 500000,
      verify: {
        apiUrl: 'https://spicy-explorer.chiliz.com/api',
        apiKey: 'xyz',
        explorerUrl: 'https://spicy-explorer.chiliz.com/'
      }
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

function getScanApiKey(name) {
  let apiKey = "UNKNOWN"
  const envApiKeyName = `${name.toUpperCase()}_API_KEY`;
  if (process.env[envApiKeyName]) {
    console.log(`loading ${name} key from env ${envApiKeyName}`);
    apiKey = process.env[envApiKeyName];
    console.log(`loaded ${name} key from env ${envApiKeyName}`);
  } else {
    const filePath = path.join(getConfigPath(), name + ".json");
    if (fs.existsSync(filePath)) {
      console.log(`Loading ${name} key from ${filePath}`);
      apiKey = require(filePath).apiKey;
      console.log(`loaded ${name} api key`);
    } else {
      console.log(`unable to load ${name} key from config`)
    }
  }
  return apiKey;
}

module.exports = {
  api_keys: {
    etherscan: getScanApiKey('etherscan'),
    polygonscan: getScanApiKey('polygonscan'),
    polygon_mumbai: getScanApiKey('polygonscan'),
    optimistic_etherscan: getScanApiKey('optimisticscan')
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
    rinkeby2: createNetwork("rinkeby2"),
    polygon_mumbai: createNetwork("polygon_mumbai"),
    polygon_mainnet: createNetwork("polygon_mainnet"),
    polygon_dev: createNetwork("polygon_dev"),
    dev: createNetwork("dev"),
    goerli: createNetwork("goerli"),
    staging: createNetwork("staging"),
    polygon_staging: createNetwork("polygon_staging"),
    optimism_mainnet: createNetwork("optimism_mainnet"),
    optimism_goerli: createNetwork("optimism_goerli"),
    mantle_testnet: createNetworkMantelTest("mantle_testnet"),
    mantle_mainnet: createNetworkMantelTest("mantle_mainnet"),
    arbitrum_goerli: createNetwork("arbitrum_goerli"),
    arbitrum_sepolia: createNetworkArbitrumSepolia("arbitrum_sepolia"), 
    arbitrum_mainnet: createNetworkArbitrumSepolia("arbitrum_mainnet"),
    zkatana_testnet: createNetworkZKatanaTest("zkatana_testnet"),
    chiliz_testnet: createNetworkChilizTestnet("chiliz_testnet"),
    chiliz_mainnet: createNetworkChilizTestnet("chiliz_mainnet"),
  },

  compilers: {
    solc: {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  }
}