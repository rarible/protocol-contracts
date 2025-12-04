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
      "@rarible/transfer-proxy/contracts/lazy-mint/erc721/ERC721LazyMintTransferProxy.sol",
      "@rarible/transfer-proxy/contracts/lazy-mint/erc1155/ERC1155LazyMintTransferProxy.sol",
      "@rarible/exchange-v2/contracts/ExchangeV2.sol",
      "@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol",
      "@rarible/royalties-registry/contracts/RoyaltiesRegistryPermissioned.sol",
      "@rarible/custom-matchers/contracts/AssetMatcherCollection.sol",
      "@rarible/tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol",
      "@rarible/tokens/contracts/erc-721-minimal/erc-721-minimal-meta/ERC721RaribleMeta.sol",
      "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeacon.sol",
      "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeaconMeta.sol",
      "@rarible/tokens/contracts/create-2/ERC721RaribleFactoryC2.sol",
      "@rarible/tokens/contracts/erc-1155/ERC1155Rarible.sol",
      "@rarible/tokens/contracts/erc-1155/erc-1155-meta/ERC1155RaribleMeta.sol",
      "@rarible/tokens/contracts/beacons/ERC1155RaribleBeacon.sol",
      "@rarible/tokens/contracts/beacons/ERC1155RaribleBeaconMeta.sol",
      "@rarible/tokens/contracts/create-2/ERC1155RaribleFactoryC2.sol",
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
});
