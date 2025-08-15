import 'dotenv/config';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-immutable-proxy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
  loadFactoryAddresses,
} from "@rarible/deploy-utils";

import "./tasks";

const { HARDWARE_DERIVATION, DEPLOYER_ADDRESS } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.23",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            
          },
          evmVersion: "london",
        },
      },
    ],
    overrides: {
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
        runs: 20,
        evmVersion: "london",
      },
    },
  },
  namedAccounts: {
    // Fallback to the first local account if the env-vars are missing
    deployer: HARDWARE_DERIVATION && DEPLOYER_ADDRESS
      ? `${HARDWARE_DERIVATION}:${DEPLOYER_ADDRESS}`
      : 0,
  },
  paths: {
    sources: "src",
    tests: "tests"
  },
  networks: {
    hardhat: {
      gas: 10000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "1000000000000000000",
      },
      mining: {
        auto: true,
        interval: 500
      }
    },
    ...loadNetworkConfigs()
  },
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
  deterministicDeployment: loadFactoryAddresses(),
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "", // Single key (string); works for Basescan since it uses Etherscan API keys
      // OR for multiple networks: apiKey: { base_sepolia: process.env.ETHERSCAN_API_KEY || "" } (object format)
    },
  }
};

export default config;
