import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-immutable-proxy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import * as dotenv from "dotenv";

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
} from "@rarible/deploy-utils";

import "./tasks";

dotenv.config();

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
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    sources: "src",
  },
  networks: loadNetworkConfigs(),
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
  deterministicDeployment: {
    '421614': {
        factory: '0x933AcD72513796c31dc9B63579130335Dcd4a961'
    },
    '5003': {
      factory: '0x933AcD72513796c31dc9B63579130335Dcd4a961'
    },
    '11155111': {
      factory: '0x933AcD72513796c31dc9B63579130335Dcd4a961'
    },
    '4202': {
      factory: '0x933AcD72513796c31dc9B63579130335Dcd4a961'
    }, 
    '90354': {
      factory: '0x933AcD72513796c31dc9B63579130335Dcd4a961'
    },
    '713715': {
      factory: '0x933AcD72513796c31dc9B63579130335Dcd4a961'
    }
  }
};



export default config;
