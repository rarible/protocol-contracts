import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-truffle5";

import type {
  HttpNetworkUserConfig,
} from "hardhat/types";
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";
import fs from "fs";
import "./tasks";

dotenv.config();

function getConfigPath() {
  const configPath = process.env["NETWORK_CONFIG_PATH"];
  if (configPath) {
    return configPath;
  } else {
    return path.join(os.homedir(), ".ethereum");
  }
}

function getNetworkApiKey(name: string): string {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (!!json.verify) {
      return json.verify.apiKey;
    }
    else {
      return "xyz"
    }
  } else {
    // File doesn't exist in path
    return "xyz";
  }
}

function getNetworkApiUrl(name: string): string {
  let result:string = "";
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.apiUrl) {
      result = json.verify.apiUrl;
    }
  }
  return result;
}

function getNetworkExplorerUrl(name: string): string {
  let result:string = "";
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.explorerUrl) {
      result = json.verify.explorerUrl;
    }
  }
  return result;
}

function createNetwork(name: string): HttpNetworkUserConfig {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.apiUrl && json.verify.apiUrl.endsWith("/api")) {
      json.verify.apiUrl = json.verify.apiUrl.slice(0, -4);
    }
    //if frame
    if (!json.key) {
      return {
        url: json.url || "",
        chainId: json.network_id,
        timeout: 60000,
      }
    } else {
      // if not frame
      return {
        from: json.address,
        gasPrice: "auto",
        chainId: parseInt(json.network_id),
        url: json.url || "",
        accounts: [json.key],
        gas: "auto",
        saveDeployments: true,
        verify: json.verify
          ? {
              etherscan: {
                apiKey: "4BX5JGM9IBFRHSDBMRCS4R66TX123T9E22",
                apiUrl: json.verify.apiUrl,
              },
            }
          : null,
        zksync: json.zksync === true,
      } as HttpNetworkUserConfig;
    }
  } else {
    // File doesn't exist in path
    return {
      from: "0x0000000000000000000000000000000000000000",
      gas: 0,
      chainId: 0,
      url: "",
      accounts: [],
      gasPrice: 0,
    };
  }
}

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
    deployer: 0,
  },
  paths: {
    sources: "src",
  },
  networks: {
    hardhat: {},
    mainnet: createNetwork("mainnet"),
    polygon_mumbai: createNetwork("polygon_mumbai"),
    polygon_mainnet: createNetwork("polygon_mainnet"),
    polygon_dev: createNetwork("polygon_dev"),
    dev: createNetwork("dev"),
    goerli: createNetwork("goerli"),
    sepolia: createNetwork("sepolia"),
    staging: createNetwork("staging"),
    polygon_staging: createNetwork("polygon_staging"),
    optimism_mainnet: createNetwork("optimism_mainnet"),
    optimism_goerli: createNetwork("optimism_goerli"),
    mantle_testnet: createNetwork("mantle_testnet"),
    mantle_mainnet: createNetwork("mantle_mainnet"),
    arbitrum_goerli: createNetwork("arbitrum_goerli"),
    arbitrum_sepolia: createNetwork("arbitrum_sepolia"),
    arbitrum_mainnet: createNetwork("arbitrum_mainnet"),
    zkatana_testnet: createNetwork("zkatana_testnet"),
    zkatana_mainnet: createNetwork("zkatana_mainnet"),
    chiliz_testnet: createNetwork("chiliz_testnet"),
    chiliz_mainnet: createNetwork("chiliz_mainnet"),
    zksync_testnet: createNetwork("zksync_testnet"),
    lightlink: createNetwork("lightlink"),
    lightlink_pegasus: createNetwork("lightlink_pegasus"),
    zksync: {
      ...createNetwork("zksync"),
      ethNetwork: "mainnet",
      zksync: true
    },
    rari_testnet: createNetwork("rari_testnet"),
    rari: createNetwork("rari"),
    base_sepolia: createNetwork("base_sepolia"),
    base: createNetwork("base"),
    zksync_sepolia: createNetwork("zksync_sepolia"),
    celo_alfajores_testnet: createNetwork("celo_alfajores_testnet"),
    celo: createNetwork("celo"),
    mantle_sepolia_testnet: createNetwork("mantle_sepolia_testnet"),
    fief_playground_testnet: createNetwork("fief_playground_testnet"),
    oasis_sapphire_testnet: createNetwork("oasis_sapphire_testnet"),
    oasis: createNetwork("oasis"),
    xai_sepolia_testnet: createNetwork("xai_sepolia_testnet"),
    xai: createNetwork("xai"),
    kroma_sepolia: createNetwork("kroma_sepolia"),
    kroma: createNetwork("kroma"),
    astar: createNetwork("astar"),
    oasys_testnet: createNetwork("oasys_testnet"),
    oasys: createNetwork("oasys"),
    zkLink: {
      zksync: true,
      ethNetwork: "mainnet",
      ...createNetwork("zkLink"),
    },
    astar_zkyoto_testnet: createNetwork("astar_zkyoto_testnet"),
    oasys_testnet_saakuru: createNetwork("oasys_testnet_saakuru")
  },
  etherscan: {
    apiKey: {
      mainnet: getNetworkApiKey('mainnet'),
      polygon: getNetworkApiKey('polygon_mainnet'),
      mumbai: getNetworkApiKey('polygon_mumbai'),
      goerli: getNetworkApiKey("goerli"),
      sepolia: getNetworkApiKey("sepolia"),
      mantle_mainnet: getNetworkApiKey("mantle_mainnet"),
      mantle_testnet: getNetworkApiKey("mantle_testnet"),
      arbitrum_sepolia: getNetworkApiKey("arbitrum_sepolia"),
      arbitrum_mainnet: getNetworkApiKey("arbitrum_mainnet"),
      zksync_testnet: getNetworkApiKey("zksync_testnet"),
      rari_testnet: getNetworkApiKey("rari_testnet"),
      mantle_sepolia_testnet: getNetworkApiKey("mantle_sepolia_testnet"),
      fief_playground_testnet: getNetworkApiKey("fief_playground_testnet"),
      oasis_sapphire_testnet: getNetworkApiKey("oasis_sapphire_testnet"),
      xai_sepolia_testnet: getNetworkApiKey("xai_sepolia_testnet"),
      base: getNetworkApiKey("base"),
      celo: getNetworkApiKey("celo"),
      lightlink: getNetworkApiKey("lightlink"),
      oasis: getNetworkApiKey("oasis"),
      rari: getNetworkApiKey("rari"),
      xai: getNetworkApiKey("xai"),
      kroma_sepolia: getNetworkApiKey("kroma_sepolia"),
      kroma: getNetworkApiKey("kroma"),
      astar: getNetworkApiKey("astar"),
      oasys_testnet: getNetworkApiKey("oasys_testnet"),
      oasys: getNetworkApiKey("oasys"),
      astar_zkyoto_testnet: getNetworkApiKey("astar_zkyoto_testnet"),
      oasys_testnet_saakuru: getNetworkApiKey("oasys_testnet_saakuru")
    },
    customChains: [
      {
        network: "oasys_testnet_saakuru",
        chainId: createNetwork("oasys_testnet_saakuru").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("oasys_testnet_saakuru"),
          browserURL: getNetworkExplorerUrl("oasys_testnet_saakuru"),
        },
      },
      {
        network: "astar_zkyoto_testnet",
        chainId: createNetwork("astar_zkyoto_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("astar_zkyoto_testnet"),
          browserURL: getNetworkExplorerUrl("astar_zkyoto_testnet"),
        },
      },
      {
        network: "oasys",
        chainId: createNetwork("oasys").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("oasys"),
          browserURL: getNetworkExplorerUrl("oasys"),
        },
      },
      {
        network: "oasys_testnet",
        chainId: createNetwork("oasys_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("oasys_testnet"),
          browserURL: getNetworkExplorerUrl("oasys_testnet"),
        },
      },
      {
        network: "astar",
        chainId: createNetwork("astar").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("astar"),
          browserURL: getNetworkExplorerUrl("astar"),
        },
      },
      {
        network: "kroma",
        chainId: createNetwork("kroma").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("kroma"),
          browserURL: getNetworkExplorerUrl("kroma"),
        },
      },
      {
        network: "base",
        chainId: createNetwork("base").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("base"),
          browserURL: getNetworkExplorerUrl("base"),
        },
      },
      {
        network: "celo",
        chainId: createNetwork("celo").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("celo"),
          browserURL: getNetworkExplorerUrl("celo"),
        },
      },
      {
        network: "lightlink",
        chainId: createNetwork("lightlink").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("lightlink"),
          browserURL: getNetworkExplorerUrl("lightlink"),
        },
      },
      {
        network: "oasis",
        chainId: createNetwork("oasis").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("oasis"),
          browserURL: getNetworkExplorerUrl("oasis"),
        },
      },
      {
        network: "rari",
        chainId: createNetwork("rari").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("rari"),
          browserURL: getNetworkExplorerUrl("rari"),
        },
      },
      {
        network: "xai",
        chainId: createNetwork("xai").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("xai"),
          browserURL: getNetworkExplorerUrl("xai"),
        },
      },
      {
        network: "kroma_sepolia",
        chainId: createNetwork("kroma_sepolia").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("kroma_sepolia"),
          browserURL: getNetworkExplorerUrl("kroma_sepolia"),
        },
      },
      {
        network: "xai_sepolia_testnet",
        chainId: createNetwork("xai_sepolia_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("xai_sepolia_testnet"),
          browserURL: getNetworkExplorerUrl("xai_sepolia_testnet"),
        },
      },
      {
        network: "oasis_sapphire_testnet",
        chainId: createNetwork("oasis_sapphire_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("oasis_sapphire_testnet"),
          browserURL: getNetworkExplorerUrl("oasis_sapphire_testnet"),
        },
      },
      {
        network: "fief_playground_testnet",
        chainId: createNetwork("fief_playground_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("fief_playground_testnet"),
          browserURL: getNetworkExplorerUrl("fief_playground_testnet"),
        },
      },
      {
        network: "base_sepolia",
        chainId: createNetwork("base_sepolia").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("base_sepolia"),
          browserURL: getNetworkExplorerUrl("base_sepolia"),
        },
      },
      {
        network: "rari_testnet",
        chainId: createNetwork("rari_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("rari_testnet"),
          browserURL: getNetworkExplorerUrl("rari_testnet"),
        },
      },
      {
        network: "mantle_sepolia_testnet",
        chainId: createNetwork("mantle_sepolia_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("mantle_sepolia_testnet"),
          browserURL: getNetworkExplorerUrl("mantle_sepolia_testnet"),
        },
      },
      {
        network: "mantle_mainnet",
        chainId: createNetwork("mantle_mainnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("mantle_mainnet"),
          browserURL: getNetworkExplorerUrl("mantle_mainnet"),
        },
      },
      {
        network: "mantle_testnet",
        chainId: createNetwork("mantle_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("mantle_testnet"),
          browserURL: getNetworkExplorerUrl("mantle_testnet"),
        },
      },
      {
        network: "arbitrum_sepolia",
        chainId: createNetwork("arbitrum_sepolia").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("arbitrum_sepolia"),
          browserURL: getNetworkExplorerUrl("arbitrum_sepolia"),
        },
      },
      {
        network: "arbitrum_mainnet",
        chainId: createNetwork("arbitrum_mainnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("arbitrum_mainnet"),
          browserURL: getNetworkExplorerUrl("arbitrum_mainnet"),
        },
      },
      {
        network: "zksync_testnet",
        chainId: createNetwork("zksync_testnet").chainId!,
        urls: {
          apiURL: getNetworkApiUrl("zksync_testnet"),
          browserURL: getNetworkExplorerUrl("zksync_testnet"),
        },
      },
    ],
  },
  zksolc: {
    version: "1.3.18",
    settings: {
      isSystem: false, // optional.  Enables Yul instructions available only for zkSync system contracts and libraries
      forceEvmla: false, // optional. Falls back to EVM legacy assembly if there is a bug with Yul
      optimizer: {
        enabled: true, // optional. True by default
        mode: 'z' // optional. 3 by default, z to optimize bytecode size
      },
    }
  },
};



export default config;
