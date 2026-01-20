import 'dotenv/config';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
  loadFactoryAddresses,
  getNetworkApiKey,
} from "@rarible/deploy-utils";

const { HARDWARE_DERIVATION, DEPLOYER_ADDRESS, ETHERSCAN_API_KEY } = process.env;

// For Etherscan v2 API, use a single API key
const etherscanApiKey = ETHERSCAN_API_KEY || getNetworkApiKey("base");

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
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
        runs: 200,
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
    tests: "test"
  },
  networks: {
    hardhat: {
      gas: 10000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000",
      },
    },
    ...loadNetworkConfigs()
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
  sourcify: {
    enabled: true,
  },
  deterministicDeployment: loadFactoryAddresses(),
};

export default config;
