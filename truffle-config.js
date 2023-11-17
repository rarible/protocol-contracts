const fs = require("fs");
const os = require("os");
const path = require("path");
require("dotenv").config();

function getConfigPath() {
  const configPath = process.env["NETWORK_CONFIG_PATH"];
  if (configPath) {
    return configPath;
  } else {
    return path.join(os.homedir(), ".ethereum");
  }
}

function createNetwork(name) {
  try {
    var json = require(path.join(getConfigPath(), name + ".json"));
    if (json) {
      var gasPrice = json.gasPrice != null ? json.gasPrice : 2000000000;
      const res = {
        provider: () => {
          const { estimate } = require("@rarible/estimate-middleware");
          if (json.path != null) {
            const {
              createProvider: createTrezorProvider,
            } = require("@rarible/trezor-provider");
            const provider = createTrezorProvider({
              url: json.url,
              path: json.path,
              chainId: json.network_id,
            });
            provider.send = provider.sendAsync;
            return provider;
          } else {
            return createProvider(json.address, json.key, json.url);
          }
        },
        from: json.address,
        gas: 15000000,
        gasPrice: gasPrice,
        network_id: json.network_id,
        skipDryRun: true,
        networkCheckTimeout: 500000,
      };
      if (json.verify) {
        res.verify = {
          apiUrl: json.verify.apiUrl,
          apiKey: json.verify.apiKey,
          explorerUrl: json.verify.explorerUrl,
        };
      }
      return res;
    }
    return {};
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
  let apiKey = "UNKNOWN";
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
      console.log(`unable to load ${name} key from config`);
    }
  }
  return apiKey;
}

module.exports = {
  api_keys: {
    etherscan: getScanApiKey("etherscan"),
    polygonscan: getScanApiKey("polygonscan"),
    polygon_mumbai: getScanApiKey("polygonscan"),
    optimistic_etherscan: getScanApiKey("optimisticscan"),
  },

  plugins: ["truffle-plugin-verify"],

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
    mantle_testnet: createNetwork("mantle_testnet"),
    mantle_mainnet: createNetwork("mantle_mainnet"),
    arbitrum_goerli: createNetwork("arbitrum_goerli"),
    arbitrum_sepolia: createNetwork("arbitrum_sepolia"),
    arbitrum_mainnet: createNetwork("arbitrum_mainnet"),
    zkatana_testnet: createNetwork("zkatana_testnet"),
    zkatana_mainnet: createNetwork("zkatana_mainnet"),
    chiliz_testnet: createNetwork("chiliz_testnet"),
    chiliz_mainnet: createNetwork("chiliz_mainnet"),
    lightlink_pegasus: createNetwork("lightlink_pegasus"),
    lightlink_phoenix: createNetwork("lightlink_phoenix"),
  },

  compilers: {
    solc: {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "istanbul",
      },
    },
  },
};
