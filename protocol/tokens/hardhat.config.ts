import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatEthers from "@nomicfoundation/hardhat-ignition-ethers"
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatTypechain, hardhatEthers],
  solidity: {
    npmFilesToBuild: [
      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol", 
      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol",
      "@rarible/lazy-mint/contracts/test/ERC721LazyMintTest.sol",
      "@rarible/lazy-mint/contracts/test/ERC1155LazyMintTest.sol",
      "@rarible/lazy-mint/contracts/test/ERC721LazyMintTransferProxyTest.sol",
      "@rarible/lazy-mint/contracts/test/ERC1155LazyMintTransferProxyTest.sol",
      "@rarible/lib-signature/contracts/test/TestERC1271.sol",
      "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol",
      "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol",
      "@rarible/transfer-proxy/contracts/test/contracts/TransferProxyTest.sol"],
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
  },
});
