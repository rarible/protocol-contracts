import "@matterlabs/hardhat-zksync";
import "@typechain/hardhat"; // Add TypeChain plugin

// upgradable plugin

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
      return {
        from: json.address,
        gasPrice: "auto",
        chainId: parseInt(json.network_id),
        url: json.url,
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
    version: "1.4.1",
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
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      "contracts/TWCloneFactory.sol": {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          }
        },
      },
      "contracts/lib/soladity/src/utils/LibClone.sol": {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          }
        },
      }
    },
  },
  defaultNetwork: "zksync_sepolia",
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
  },
  etherscan: {
    apiKey: "P78HUI9K9SAM5QKD6ABU91G3CPDS98MZW2"
  },
  paths: {
    
  },
  typechain: {
    outDir: "typechain-types-zk", // Output directory for generated typings
    target: "ethers-v5", // Use ethers-v6 for zksync-ethers compatibility
    alwaysGenerateOverloads: false,
    dontOverrideCompile: true, // Prevent TypeChain from overriding compile task
    externalArtifacts: [
      "artifacts-zk/contracts/**/*[!dbg].json"
    ],
  },
};

export default config;
