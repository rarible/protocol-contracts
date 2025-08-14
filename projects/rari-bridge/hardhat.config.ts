import 'dotenv/config';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
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
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
          evmVersion: "london",
        },
      },
    ],
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 20,
      },
    },
  },
  namedAccounts: {
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
    sepolia: {
      url: process.env.RPC_SEPOLIA || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "base-sepolia": {
      url: process.env.RPC_BASE_SEPOLIA || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    ...loadNetworkConfigs()
  },
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
};
export default config;