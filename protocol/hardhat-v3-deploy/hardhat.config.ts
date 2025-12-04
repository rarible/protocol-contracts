import {HardhatUserConfig, configVariable} from 'hardhat/config';

import HardhatNodeTestRunner from '@nomicfoundation/hardhat-node-test-runner';
import HardhatViem from '@nomicfoundation/hardhat-viem';
import HardhatNetworkHelpers from '@nomicfoundation/hardhat-network-helpers';
import HardhatKeystore from '@nomicfoundation/hardhat-keystore';
import HardhatVerify from '@nomicfoundation/hardhat-verify';

import HardhatDeploy from 'hardhat-deploy';
import {addForkConfiguration, addNetworksFromEnv} from 'hardhat-deploy/helpers';
import { defineConfig } from "hardhat/config";

import * as dotenv from "dotenv";
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
  plugins: [HardhatNodeTestRunner, HardhatViem, HardhatNetworkHelpers, HardhatKeystore, HardhatVerify, HardhatDeploy],
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
      "@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol",
      "@rarible/royalties-registry/contracts/RoyaltiesRegistryPermissioned.sol",
    ],
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
});
