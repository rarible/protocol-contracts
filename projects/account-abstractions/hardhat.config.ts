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
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
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