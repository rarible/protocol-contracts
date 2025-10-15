import 'dotenv/config';
import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-immutable-proxy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import '@parity/hardhat-polkadot';

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
  loadFactoryAddresses,
} from "@rarible/deploy-utils";

// import "./tasks";

const { HARDWARE_DERIVATION, DEPLOYER_ADDRESS, PRIVATE_KEY1 } = process.env;

const config: any = {
  solidity: {
    compilers: [
      {
        version: "0.5.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
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
      },
      "src/TransparentUpgradeableProxy.sol": {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
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
    // Fallback to the first local account if the env-vars are missing
    deployer: HARDWARE_DERIVATION && DEPLOYER_ADDRESS
      ? `${HARDWARE_DERIVATION}:${DEPLOYER_ADDRESS}`
      : 0,
  },
  paths: {
    sources: "src",
    tests: "test-hardhat",
    artifacts: "artifacts-dot",
    cache: "cache-dot",
  },
  networks: {
    hardhat: {
      gas: 10000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "1000000000000000000",
      },
      forking: {
        url: process.env.MAINNET_RPC_URL!,
      },
    },
    polkadotHubTestnet: {
        polkavm: true,
        url: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
        accounts: [PRIVATE_KEY1],
    },
    ...loadNetworkConfigs()
  },
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
  deterministicDeployment: loadFactoryAddresses(),
  mocha: {
    timeout: 400000
  }
};

export default config;
