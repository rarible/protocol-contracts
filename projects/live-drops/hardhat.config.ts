import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-immutable-proxy";

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
  loadFactoryAddresses,
} from "@rarible/deploy-utils";

import "./tasks";

const { HARDWARE_DERIVATION, DEPLOYER_ADDRESS, TEST_CREATOR_KEY, TEST_MINTER_KEY } = process.env;

// Load base network configs, then inject extra test accounts
const networkConfigs = loadNetworkConfigs() as Record<string, any>;
if (networkConfigs.base && (TEST_CREATOR_KEY || TEST_MINTER_KEY)) {
  const baseAccounts = Array.isArray(networkConfigs.base.accounts)
    ? [...networkConfigs.base.accounts]
    : [];
  if (TEST_CREATOR_KEY) baseAccounts.push(TEST_CREATOR_KEY);
  if (TEST_MINTER_KEY) baseAccounts.push(TEST_MINTER_KEY);
  networkConfigs.base.accounts = baseAccounts;
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.23",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
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
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer:
      HARDWARE_DERIVATION && DEPLOYER_ADDRESS
        ? `${HARDWARE_DERIVATION}:${DEPLOYER_ADDRESS}`
        : 0,
  },
  paths: {
    sources: "src",
    tests: "tests",
  },
  networks: {
    hardhat: {
      gas: 10000000,
      accounts: {
        mnemonic:
          "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "1000000000000000000000",
      },
      mining: {
        auto: true,
        interval: 500,
      },
    },
    ...networkConfigs,
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=8453",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  deterministicDeployment: loadFactoryAddresses(),
};

export default config;
