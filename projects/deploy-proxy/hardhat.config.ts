import 'dotenv/config';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy-immutable-proxy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import "./tasks";

const { HARDWARE_DERIVATION, DEPLOYER_ADDRESS } = process.env;

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