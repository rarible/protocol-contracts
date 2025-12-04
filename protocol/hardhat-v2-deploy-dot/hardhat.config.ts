import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"
import * as dotenv from "dotenv";
dotenv.config();

// Import custom tasks
import "./tasks/verify-ignition"
import "./tasks/get-constructor-args"

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.30",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,  // Lower runs = smaller code size (optimize for size)
            },
            viaIR: true,  // Enable IR-based compilation for better optimization
            evmVersion: "cancun",
        },
    },
    sourcify: {
        enabled: true,
        // Optional: specify a different Sourcify server
        apiUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
        // Optional: specify a different Sourcify repository
        browserUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
      },
    networks: {
        hardhat: {
            polkadot: {
                target: "evm",
            },
            nodeConfig: {
                nodeBinaryPath: "./bin/dev-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        localNode: {
            polkadot: {
                target: "evm",
            },
            url: `http://127.0.0.1:8545`,
        },
        polkadotHubTestnet: {
            polkadot: {
                target: "evm",
            },
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: [process.env.PRIVATE_KEY!],
        },
        sepolia: {
            url: "https://ethereum-sepolia-rpc.publicnode.com",
            accounts: [process.env.PRIVATE_KEY!],
        },
    },
    etherscan: {
        apiKey: {
          goerli: process.env.ETHERSCAN_API_KEY!,
          polkadotHubTestnet: "xyz"
        },
        customChains: [
          {
            network: "polkadotHubTestnet",
            chainId: 420420422,
            urls: {
              apiURL: "https://blockscout-passet-hub.parity-testnet.parity.io/api",
              browserURL: "https://blockscout-passet-hub.parity-testnet.parity.io/"
            }
            
          }
        ],

    }
    
}

export default config
