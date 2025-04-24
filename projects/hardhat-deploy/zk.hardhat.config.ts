import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import type {
  HttpNetworkUserConfig, HardhatUserConfig
} from "hardhat/types";
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";
import fs from "fs";
import "./tasks";

function getConfigPath() {
    const configPath = process.env["NETWORK_CONFIG_PATH"];
    if (configPath) {
      return configPath;
    } else {
      return path.join(os.homedir(), ".ethereum");
    }
}

function createNetwork(name: string): HttpNetworkUserConfig {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.apiUrl && json.verify.apiUrl.endsWith("/api")) {
      json.verify.apiUrl = json.verify.apiUrl.slice(0, -4);
    }
    //if frame
    if (!json.key) {
      return {
        url: json.url || "",
        chainId: json.network_id,
        timeout: 60000,
      }
    } else {
      // if not frame
      return {
        from: json.address,
        gasPrice: "auto",
        chainId: parseInt(json.network_id),
        url: json.url || "",
        accounts: [json.key],
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
    }
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
  zksolc: {
    version: "1.3.18",
    settings: {
        isSystem: false, // optional.  Enables Yul instructions available only for zkSync system contracts and libraries
        forceEvmla: false, // optional. Falls back to EVM legacy assembly if there is a bug with Yul
        optimizer: {
          enabled: true, // optional. True by default
          mode: 'z' // optional. 3 by default, z to optimize bytecode size
        },
      }
  },
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
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "byzantium",
        },
      },
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      "src/WETH9.sol": {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "byzantium",
        },
      },
      "src/UpgradeExecutorImport.sol": {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
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
  defaultNetwork: "zksync",
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    sources: "src",
    artifacts: "artifacts-zk"
  },
  networks: {
    sepolia: {
      zksync: false,
      url: "http://localhost:8545",
    },
    zksync_sepolia: {
      zksync: true,
      ethNetwork: "sepolia",
      ...createNetwork("zksync_sepolia"),
    },
    zksync: {
      ...createNetwork("zksync"),
      ethNetwork: "mainnet", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true
    },
    zkLinkGoerliTestnet: {
      zksync: true,
      ethNetwork: "goerli",
      ...createNetwork("zkLinkGoerliTestnet"),
      timeout: 120000
    },
    zkLink: {
      zksync: true,
      ethNetwork: "mainnet",
      ...createNetwork("zkLink"),
    },
    zkcandy_sepolia: {
      zksync: true,
      ethNetwork: "sepolia",
      ...createNetwork("zkcandy_sepolia"),
    },
    zkcandy: {
      zksync: true,
      ethNetwork: "mainnet",
      ...createNetwork("zkcandy"),
    },
    abstract_testnet: {
      zksync: true,
      ethNetwork: "sepolia",
      ...createNetwork("abstract_testnet"),
      url: "http://127.0.0.1:1248",
      chainId: 11124,
    },
    abstract: {
      zksync: true,
      ethNetwork: "mainnet",
      url: "http://127.0.0.1:1248",
      chainId: 2741,
      ...createNetwork("abstract"),
    }
  },
  etherscan: {
    apiKey: "P78HUI9K9SAM5QKD6ABU91G3CPDS98MZW2"
  }
};

export default config;
