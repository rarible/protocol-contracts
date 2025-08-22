// <ai_context>
// Hardhat task to verify contracts on Etherscan-compatible explorers
// and zkSync explorers. It auto-detects the current network type.
// - For zkSync networks (hre.network.config.zksync === true), it uses
//   @matterlabs/hardhat-zksync-verify and the network.verifyURL.
//   If --api-url is provided, it will set/normalize verifyURL, appending
//   '/contract_verification' if needed.
// - For Etherscan-style networks, it uses @nomicfoundation/hardhat-verify
//   and the new v2 single api key (no per-network keys).
// Designed to work smoothly with CREATE3 deployments where the contract
// address is known.
// </ai_context>

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

type VerifyArgs = {
  contract: string;
  address: string;
  constructorArgs: string[];
  apiUrl?: string;
  apiKey?: string;
  browserUrl?: string; // Etherscan-only convenience
};

function normalizeZkVerifyURL(input?: string): string | undefined {
  if (!input) return undefined;
  // If user passed an etherscan-style /api, strip it
  const base = input.replace(/\/api$/, "");
  // If it already ends in /contract_verification or /contracts/verify, keep it
  if (/\/contract_verification$/.test(base) || /\/contracts\/verify$/.test(base)) return base;
  // Otherwise append the standard zkSync path suffix
  return `${base}/contract_verification`;
}

task("etherscan-verify-cli", "Verifies a contract on an explorer (Etherscan or zkSync), CREATE3-friendly")
  .addParam("contract", "Fully qualified contract name, e.g. @rarible/exchange-v2/contracts/ExchangeMetaV2.sol:ExchangeMetaV2")
  .addOptionalParam("apiUrl", "Explorer API/verification endpoint. For Etherscan: https://api.etherscan.io/v2/api. For zkSync: https://<explorer>/contract_verification")
  .addOptionalParam("apiKey", "Explorer API key (Etherscan v2 single key). Not used for zkSync.")
  .addOptionalParam("browserUrl", "Explorer browser base URL (Etherscan only; defaults to apiUrl without /api)")
  .addPositionalParam("address", "Deployed contract address")
  .addVariadicPositionalParam("constructorArgs", "Constructor arguments", [])
  .setAction(async (args: VerifyArgs, hre: HardhatRuntimeEnvironment) => {
    const { contract, address, constructorArgs, apiUrl, apiKey, browserUrl } = args;

    const isZk = Boolean((hre.network.config as any).zksync);

    if (isZk) {
      // zkSync verification flow (@matterlabs/hardhat-zksync-verify)
      const zkUrl = normalizeZkVerifyURL(apiUrl) || (hre.network.config as any).verifyURL;
      if (zkUrl) {
        (hre.network.config as any).verifyURL = zkUrl;
      }

      try {
        await hre.run("verify:verify", {
          address,
          contract,
          constructorArguments: constructorArgs,
        });
        console.log(`Verified ${contract} at ${address} on zkSync-like network "${hre.network.name}".`);
      } catch (err: any) {
        const msg = (err && err.message) || String(err);
        // Helpful guidance for common FQN mistakes with node_modules packages
        if (/contract was not found/i.test(msg) || /artifact/i.test(msg)) {
          console.error(
            [
              "Artifact lookup failed. If this contract comes from a dependency, use the package FQN, for example:",
              "  --contract @rarible/exchange-v2/contracts/ExchangeMetaV2.sol:ExchangeMetaV2",
              "Also ensure the dependency is compiled (import it from some file in src/).",
            ].join("\n")
          );
        }
        console.error("Verification failed:", err);
        throw err;
      }
      return;
    }

    // Etherscan (EVM) verification flow (@nomicfoundation/hardhat-verify)
    // Ensure etherscan config object exists
    (hre.config as any).etherscan = (hre.config as any).etherscan || {};

    // Etherscan v2: prefer a single apiKey string
    if (apiKey) {
      (hre.config as any).etherscan.apiKey = apiKey;
    }

    // Allow passing custom API URL (and browser URL) at runtime for unknown networks
    if (apiUrl) {
      const { chainId } = await hre.ethers.provider.getNetwork();
      const urls = {
        apiURL: apiUrl, // v2 style endpoint expected
        browserURL: browserUrl || apiUrl.replace(/\/api$/, ""),
      };

      const existingCustomChains = ((hre.config as any).etherscan.customChains ?? []) as Array<{
        network: string;
        chainId: number;
        urls: { apiURL: string; browserURL: string };
      }>;

      // Replace or add entry for the current network
      const filtered = existingCustomChains.filter((c) => c.network !== hre.network.name);
      (hre.config as any).etherscan.customChains = [
        ...filtered,
        { network: hre.network.name, chainId: Number(chainId), urls },
      ];
    }

    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: constructorArgs,
        contract,
      });
      console.log(`Verified ${contract} at ${address} on network "${hre.network.name}".`);
    } catch (err: any) {
      const msg = (err && err.message) || String(err);

      if (/already verified/i.test(msg) || /Contract source code already verified/i.test(msg)) {
        console.log("Already verified.");
        return;
      }

      // Better hint for the classic FQN issue
      if (/CompilerVersionsMismatchError/i.test(msg) || /contract was not found/i.test(msg)) {
        console.error(
          [
            "Hint: if this is a dependency contract, use the package FQN, e.g.:",
            "  --contract @rarible/exchange-v2/contracts/ExchangeMetaV2.sol:ExchangeMetaV2",
          ].join("\n")
        );
      }

      console.error("Verification failed:", err);
      throw err;
    }
  });