import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatEthers from "@nomicfoundation/hardhat-ignition-ethers"
import hardhatDeploy from "hardhat-deploy";
import * as dotenv from "dotenv";
import { defineConfig } from "hardhat/config";
import { addForkConfiguration, addNetworksFromEnv } from "hardhat-deploy/helpers";

dotenv.config();

const networks = addForkConfiguration(
  addNetworksFromEnv({
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  }),
);

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatTypechain, hardhatEthers, hardhatDeploy],
  solidity: {
    npmFilesToBuild: [
      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol",
      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol",
      "@rarible/exchange-v2/contracts/test/RaribleTestHelper.sol",
      "@rarible/transfer-proxy/contracts/test/tokens/TestERC20.sol",
      "@rarible/transfer-proxy/contracts/test/tokens/TestERC721.sol",
      "@rarible/transfer-proxy/contracts/test/tokens/TestERC1155.sol",
      "@rarible/transfer-proxy/contracts/test/contracts/TransferProxyTest.sol",
      "@rarible/transfer-proxy/contracts/test/contracts/ERC20TransferProxyTest.sol",
      "@rarible/transfer-proxy/contracts/proxy/TransferProxy.sol",
      "@rarible/transfer-proxy/contracts/proxy/ERC20TransferProxy.sol",
      "@rarible/exchange-v2/contracts/ExchangeV2.sol",
      "@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol"],
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
  networks,
});
