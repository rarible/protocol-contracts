import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import type {
  HttpNetworkUserConfig,
} from "hardhat/types";
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";
import fs from "fs";
import "./tasks";

dotenv.config();

function getConfigPath() {
  const configPath = process.env["NETWORK_CONFIG_PATH"];
  if (configPath) {
    return configPath;
  } else {
    return path.join(os.homedir(), ".ethereum");
  }
}

function getNetworkApiKey(name: string): string {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (!!json.verify) {
      return json.verify.apiKey;
    }
    else {
      return "xyz"
    }
  } else {
    // File doesn't exist in path
    return "xyz";
  }
}

function getNetworkApiUrl(name: string): string {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    return json.verify.apiUrl;
  } else {
    // File doesn't exist in path
    return "";
  }
}

function getNetworkExplorerUrl(name: string): string {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    return json.verify.explorerUrl;
  } else {
    // File doesn't exist in path
    return "";
  }
}

function createNetwork(name: string): HttpNetworkUserConfig {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.apiUrl && json.verify.apiUrl.endsWith("/api")) {
      json.verify.apiUrl = json.verify.apiUrl.slice(0, -4);
    }
    return {
      from: json.address,
      gasPrice: "auto",
      chainId: parseInt(json.network_id),
      url: json.url,
      accounts: [process.env.PRIVATE_KEY],
      gas: "auto",
      saveDeployments: true,
      verify: json.verify
        ? {
            etherscan: {
              apiKey: "4BX5JGM9IBFRHSDBMRCS4R66TX123T9E22",
              apiUrl: json.verify.apiUrl,
            },
          }
        : null,
      zksync: json.zksync === true,
    } as HttpNetworkUserConfig;
  } else {
    // File doesn't exist in path
    return {
      from: "0x0000000000000000000000000000000000000000",
      gas: 0,
      chainId: 0,
      url: "",
      accounts: [],
      gasPrice: 0,
    };
  }
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
          evmVersion: "petersburg",
        },
      },
    ],
    overrides: {
      "contracts/ImmutableCreate2Factory.sol": {
        version: "0.5.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
          evmVersion: "petersburg",
        },
      },
    },
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    sources: "contracts",
  },
  networks: {
    hardhat: {},
    mainnet: {
      url: 'http://127.0.0.1:1248',
      chainId: 1,
      timeout: 60000,
    },
    polygon_mumbai: createNetwork("polygon_mumbai"),
    polygon_mainnet: createNetwork("polygon_mainnet"),
    polygon_dev: createNetwork("polygon_dev"),
    dev: createNetwork("dev"),
    goerli: createNetwork("goerli"),
    sepolia: createNetwork("sepolia"),
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
    zksync_testnet: createNetwork("zksync_testnet"),
    lightlink: {
      url: 'http://127.0.0.1:1248',
      chainId: 1890,
      timeout: 60000,
    },
    lightlink_pegasus: createNetwork("lightlink_pegasus"),
    zksync: {
      url: 'http://127.0.0.1:1248',
      chainId: 324,
      timeout: 60000,
      ethNetwork: "mainnet", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true
    },
    rari_testnet: createNetwork("rari_testnet"),
    rari: {
      url: 'http://127.0.0.1:1248',
      chainId: 1380012617,
      timeout: 60000,
    },
    base_sepolia: createNetwork("base_sepolia"),
    base: {
      url: 'http://127.0.0.1:1248',
      chainId: 8453,
      timeout: 60000,
    },
    zksync_sepolia: createNetwork("zksync_sepolia")
  },
  etherscan: {
    apiKey: {
      mainnet: getNetworkApiKey('mainnet'),
      polygon: getNetworkApiKey('polygon_mainnet'),
      mumbai: getNetworkApiKey('polygon_mumbai'),
      goerli: getNetworkApiKey("goerli"),
      sepolia: getNetworkApiKey("sepolia"),
      mantle_mainnet: getNetworkApiKey("mantle_mainnet"),
      mantle_testnet: getNetworkApiKey("mantle_testnet"),
      arbitrum_sepolia: getNetworkApiKey("arbitrum_sepolia"),
      arbitrum_mainnet: getNetworkApiKey("arbitrum_mainnet"),
      zksync_testnet: getNetworkApiKey("zksync_testnet"),
      rari_testnet: getNetworkApiKey("rari_testnet")
    },
    customChains: [
      {
        network: "base_sepolia",
        chainId: createNetwork("base_sepolia").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("base_sepolia"),
          browserURL: getNetworkExplorerUrl("base_sepolia"),
        },
      },
      {
        network: "rari_testnet",
        chainId: createNetwork("rari_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("rari_testnet"),
          browserURL: getNetworkExplorerUrl("rari_testnet"),
        },
      },
      {
        network: "mantle_mainnet",
        chainId: createNetwork("mantle_mainnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("mantle_mainnet"),
          browserURL: getNetworkExplorerUrl("mantle_mainnet"),
        },
      },
      {
        network: "mantle_testnet",
        chainId: createNetwork("mantle_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("mantle_testnet"),
          browserURL: getNetworkExplorerUrl("mantle_testnet"),
        },
      },
      {
        network: "arbitrum_sepolia",
        chainId: createNetwork("arbitrum_sepolia").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("arbitrum_sepolia"),
          browserURL: getNetworkExplorerUrl("arbitrum_sepolia"),
        },
      },
      {
        network: "arbitrum_mainnet",
        chainId: createNetwork("arbitrum_mainnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("arbitrum_mainnet"),
          browserURL: getNetworkExplorerUrl("arbitrum_mainnet"),
        },
      },
      {
        network: "zksync_testnet",
        chainId: createNetwork("zksync_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("zksync_testnet"),
          browserURL: getNetworkExplorerUrl("zksync_testnet"),
        },
      },
    ],
  },
  zksolc: {
    compilerSource: 'binary',
    settings: {
      isSystem: false, // optional.  Enables Yul instructions available only for zkSync system contracts and libraries
      forceEvmla: false, // optional. Falls back to EVM legacy assembly if there is a bug with Yul
      optimizer: {
        enabled: true, // optional. True by default
        mode: 'z' // optional. 3 by default, z to optimize bytecode size
      },
    }
  },
};



export default config;
