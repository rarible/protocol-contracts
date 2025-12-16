import hardhatEthers from "@nomicfoundation/hardhat-ignition-ethers"
import hardhatIgnitionEthers from "@nomicfoundation/hardhat-ignition-ethers";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
import { defineConfig, configVariable } from "hardhat/config";

dotenv.config();

const sepoliaRpcUrl =
  process.env.SEPOLIA_RPC_URL ??
  process.env.ALCHEMY_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";

export default defineConfig({
  plugins: [hardhatEthers, hardhatIgnitionEthers, hardhatToolboxMochaEthersPlugin, hardhatTypechain, hardhatVerify],
  solidity: {
    npmFilesToBuild: [
      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol", 
      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol"],
    profiles: {
      default: {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      url: sepoliaRpcUrl,
      type: "http",
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
