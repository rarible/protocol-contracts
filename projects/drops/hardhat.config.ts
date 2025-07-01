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
  },
  networks: loadNetworkConfigs(),
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
  deterministicDeployment: loadFactoryAddresses(),
};

export default config;
