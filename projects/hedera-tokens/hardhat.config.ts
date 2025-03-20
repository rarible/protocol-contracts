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
  loadFactoryAddresses,
} from "@rarible/deploy-utils";

import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
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
      }
    ],
    overrides: {
      "contracts/exchange/UnsafeTransferProxy.sol": {
        version: "0.7.6",
      },
      "contracts/exchange/ExchangeV2Import.sol": {
        version: "0.7.6",
      },
      "contracts/exchange/TransferProxiesImport.sol": {
        version: "0.7.6",
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
    deployer: 0,
  },
  paths: {
    sources: "contracts",
  },

    networks: {
      testnet: {
        // HashIO testnet endpoint from the TESTNET_ENDPOINT variable in the .env file
        url: process.env.TESTNET_ENDPOINT,
        timeout: 2000000,
        allowUnlimitedContractSize: true,
        // Your ECDSA account private key pulled from the .env file
        accounts: [process.env.OPERATOR_KEY!, process.env.OTHER_OPERATOR_KEY!, process.env.FEE_COLLECTOR_KEY!, process.env.SECOND_FEE_COLLECTOR_KEY!],
      },
      // previewnet: {
      //   // HashIO testnet endpoint from the TESTNET_ENDPOINT variable in the .env file //https://previewnet.hashio.io/api
      //   url: 'https://previewnet.hashio.io/api', //https://previewnet.hashio.io/api http://localhost:7546/
      //   timeout: 20000000000,
      //   allowUnlimitedContractSize: true,
      //   // Your ECDSA account private key pulled from the .env file
      //   accounts: [process.env.OPERATOR_KEY, process.env.OTHER_OPERATOR_KEY, process.env.TREASURY_KEY],
      // },
      // -----------------------------------------
    // Add Polygon networks here
    // -----------------------------------------
    polygon: {
      url: process.env.POLYGON_MAINNET_URL || "",
      chainId: 137,
      timeout: 2_000_000,
      allowUnlimitedContractSize: true,
      accounts: [
        process.env.OPERATOR_KEY!,
        process.env.OTHER_OPERATOR_KEY!,
        // Add more if you need
      ],
    },
    berachain: {
      url: process.env.BERACHAIN_MAINNET_URL || "",
      chainId: 80094,
      timeout: 2_000_000,
      allowUnlimitedContractSize: true,
      accounts: [
        process.env.OPERATOR_KEY!,
        process.env.OTHER_OPERATOR_KEY!,
        // Add more if you need
      ],
    },
    mantle: {
      url: process.env.MANTLE_MAINNET_URL || "",
      chainId: 5000,
      timeout: 2_000_000,
      allowUnlimitedContractSize: true,
      accounts: [process.env.OPERATOR_KEY!, process.env.OTHER_OPERATOR_KEY!],
    },
    },
  
  etherscan: {
    apiKey: loadApiKeys(),
    customChains: loadCustomNetworks(),
  },
  deterministicDeployment: loadFactoryAddresses(),
};

export default config;
