import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-immutable-proxy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import * as dotenv from "dotenv";

import "./tasks";

dotenv.config();

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
} from "@rarible/deploy-utils";

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
      "contracts/ImmutableCreate2Factory.sol": {
        version: "0.5.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          }
        },
      },
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
    // ledger path 4
    // deployer: "ledger://m/44'/60'/3'/0/0:0xCfDBcc22887744ab38bC447Eb7fc4A419F24923e",
    // deployer: 0 -- default
    deployer: "ledger://m/44'/60'/3'/0/0:0xCfDBcc22887744ab38bC447Eb7fc4A419F24923e",
  },
  paths: {
    sources: "contracts",
  },
  networks: loadNetworkConfigs(),
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
  typechain: {
    outDir: "typechain-types", // Output directory for generated typings
    target: "ethers-v5", // Use ethers-v6 for zksync-ethers compatibility
    alwaysGenerateOverloads: false,
    // externalArtifacts: [
    //   "artifacts/contracts/**/*[!dbg].json"
    // ],
  },
};

export default config;