// <ai_context>
// Hardhat task to verify contracts on Etherscan-compatible explorers,
// allowing runtime injection of API URL and API key. Designed to work
// smoothly with CREATE3 deployments where the contract address is known.
// </ai_context>

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

type VerifyArgs = {
  contract: string;
  address: string;
  constructorArgs: string[];
  apiUrl?: string;
  apiKey?: string;
  browserUrl?: string;
};

/**
npx hardhat etherscan-verify-cli \
--network base_sepolia \
--contract src/RariOFT.sol:RariOFT \
--api-url https://api-sepolia.basescan.org/api \
--api-key API_KEY \
0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 \
0x6EDCE65403992e310A62460808c4b910D972f10f \
0xe223825497c435BAeaf318F03d33Ec704954028A 
  */ 

task("etherscan-verify-cli", "Verifies a contract on an Etherscan-compatible explorer (CREATE3-friendly)")
  .addParam("contract", "Fully qualified contract name, e.g. src/RariOFT.sol:RariOFT")
  .addOptionalParam("apiUrl", "Explorer API endpoint, e.g. https://api-sepolia.basescan.org/api")
  .addOptionalParam("apiKey", "Explorer API key")
  .addOptionalParam("browserUrl", "Explorer browser base URL (defaults to apiUrl without /api)")
  .addPositionalParam("address", "Deployed contract address")
  .addVariadicPositionalParam("constructorArgs", "Constructor arguments", [])
  .setAction(async (args: VerifyArgs, hre: HardhatRuntimeEnvironment) => {
    const { contract, address, constructorArgs, apiUrl, apiKey, browserUrl } = args;

    // Ensure etherscan config object exists
    (hre.config as any).etherscan = (hre.config as any).etherscan || {};

    // Allow passing API key at runtime
    if (apiKey) {
      const existingApiKey = (hre.config as any).etherscan.apiKey;
      if (existingApiKey && typeof existingApiKey === "object") {
        (hre.config as any).etherscan.apiKey[hre.network.name] = apiKey;
      } else {
        (hre.config as any).etherscan.apiKey = { [hre.network.name]: apiKey };
      }
    }

    // Allow passing custom API URL (and browser URL) at runtime
    if (apiUrl) {
      const { chainId } = await hre.ethers.provider.getNetwork();
      const urls = {
        apiURL: apiUrl,
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
      console.error("Verification failed:", err);
      throw err;
    }
  });