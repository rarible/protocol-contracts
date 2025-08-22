import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-ethers";
import "@matterlabs/hardhat-zksync-verify";
import "zksync-ethers";

import type {
  HttpNetworkUserConfig, HardhatUserConfig
} from "hardhat/types";
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";
import fs from "fs";
import "./tasks";

const { HARDWARE_DERIVATION, DEPLOYER_ADDRESS } = process.env;

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

    // normalize v1-style /api endings for etherscan config if present
    if (json.verify && json.verify.apiUrl && json.verify.apiUrl.endsWith("/api")) {
      json.verify.apiUrl = json.verify.apiUrl.slice(0, -4);
    }

    // if frame (no key), minimal config
    if (!json.key) {
      const base: any = {
        url: json.url || "",
        chainId: json.network_id,
        timeout: 60000,
      };
      // For zkSync networks, attempt to pass through verifyURL from json.verify.apiUrl when available
      if (json.zksync === true && json.verify && json.verify.apiUrl) {
        base.verifyURL = json.verify.apiUrl;
      }
      return base as HttpNetworkUserConfig;
    } else {
      // non-frame config
      const isZk = json.zksync === true;
      const base: any = {
        from: json.address,
        gasPrice: "auto",
        chainId: parseInt(json.network_id),
        url: json.url || "",
        accounts: [json.key],
        gas: "auto",
        saveDeployments: true,
        zksync: isZk,
      };

      // Etherscan-style verify block (used by @nomicfoundation/hardhat-verify)
      base.verify = json.verify
        ? {
            etherscan: {
              // v1 per-network keys are deprecated; we keep structure here only
              // so legacy flows don't break. Our task now prefers a single apiKey.
              apiKey: "4BX5JGM9IBFRHSDBMRCS4R66TX123T9E22",
              apiUrl: json.verify.apiUrl,
            },
          }
        : null;

      // zkSync verifier endpoint (used by @matterlabs/hardhat-zksync-verify)
      if (isZk && json.verify && json.verify.apiUrl) {
        base.verifyURL = json.verify.apiUrl;
      }

      return base as HttpNetworkUserConfig;
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
    version: "1.5.7",
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
      {
        version: "0.5.17",
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
    // Fallback to the first local account if the env-vars are missing
    deployer: HARDWARE_DERIVATION && DEPLOYER_ADDRESS
      ? `${HARDWARE_DERIVATION}:${DEPLOYER_ADDRESS}`
      : 0,
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
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification'
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
      verifyURL: 'https://goerli.explorer.zklink.io/contracts/verify',
      timeout: 120000
    },
    zkLink: {
      zksync: true,
      ethNetwork: "mainnet",
      ...createNetwork("zkLink"),
      verifyURL: 'https://explorer.zklink.io/contracts/verify'
    },
    zkcandy_sepolia: {
      zksync: true,
      ethNetwork: "sepolia",
      ...createNetwork("zkcandy_sepolia"),
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification'
    },
    zkcandy: {
      ...createNetwork("zkcandy"),
      zksync: true,
      ethNetwork: "mainnet",
    },
    abstract_testnet: {
      ...createNetwork("abstract_testnet"),
    },
    abstract: {
      zksync: true,
      ethNetwork: "mainnet",
      ...createNetwork("abstract"),
    }
  },
  etherscan: {
    // prefer a single Etherscan v2 API key; task can override at runtime
    apiKey: "P78HUI9K9SAM5QKD6ABU91G3CPDS98MZW2"
  },
  sourcify: {
    enabled: false
  }
};

export default config;