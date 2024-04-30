import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

import {
  loadApiKeys,
  loadCustomNetworks,
  loadNetworkConfigs,
} from "@rarible/deploy-utils";


const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.12", // Specify the Solidity version
    settings: {
      optimizer: {
        enabled: true, // Enable the optimizer
        runs: 200 // The optimizer's number of runs
      }
    }
  },
  networks: loadNetworkConfigs(),
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  }
};


export default config;
