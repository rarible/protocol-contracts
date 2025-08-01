/*
<ai_context>
Hardhat task: Export protocol fee and ownership information for ExchangeV2 only.
- For ExchangeV2, fetches protocol fee receiver, seller fee, and buyer fee.
- Finds ProxyAdmin and fetches owner(), shows in the same row as ExchangeV2.
- Only outputs ExchangeV2 address in table, not ProxyAdmin or other contracts.
- Reads deployed contract addresses from hardhat-deploy deployments.
- Exports results in Markdown to console.
- Skips missing network deployment directories (e.g. "hardhat") gracefully.
- Includes chainId, does not shorten addresses.
- Reads chainId from .chainId file in deployment dir, if present.
- Uses ExchangeV2 ABI from TypeChain.
</ai_context>
*/
import { task } from "hardhat/config";
import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { ExchangeV2, ExchangeV2__factory } from "@rarible/exchange-v2/typechain-types";

import { getProtocolFee } from "@rarible/exchange-v2/sdk/protocolFee";
import { HttpNetworkConfig } from "hardhat/types";

// Helper: Get all subdirectories in a directory
async function getSubdirectories(source: string): Promise<string[]> {
  if (!fs.existsSync(source)) return [];
  const entries = await fs.promises.readdir(source, { withFileTypes: true });
  return entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
}

// Helper to read chainId from .chainId file in deployment dir
async function getChainIdFromDeployments(deploymentsDir: string): Promise<string | undefined> {
  const chainIdFile = path.join(deploymentsDir, ".chainId");
  try {
    if (fs.existsSync(chainIdFile)) {
      const value = await fs.promises.readFile(chainIdFile, "utf-8");
      return value.trim();
    }
  } catch {}
  // fallback: try to read from deployment .json files
  try {
    const files = await fs.promises.readdir(deploymentsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const deployInfo = JSON.parse(await fs.promises.readFile(path.join(deploymentsDir, file), "utf-8"));
      if (deployInfo.chainId) {
        return String(deployInfo.chainId);
      }
      if (deployInfo.network && deployInfo.network.chainId) {
        return String(deployInfo.network.chainId);
      }
    }
  } catch {}
  return undefined;
}

// Find ProxyAdmin address from deployment files in the same dir
async function getProxyAdminAddress(deploymentsDir: string): Promise<string | undefined> {
  try {
    const files = await fs.promises.readdir(deploymentsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const deployInfo = JSON.parse(await fs.promises.readFile(path.join(deploymentsDir, file), "utf-8"));
      if (
        (deployInfo.contractName === "DefaultProxyAdmin" || file.replace(/\.json$/, "") === "DefaultProxyAdmin") &&
        deployInfo.address
      ) {
        return deployInfo.address;
      }
    }
  } catch {}
  return undefined;
}

task("export-fees-and-ownerships", "Export protocol fee and proxy admin owner info for ExchangeV2 in Markdown (all networks)")
  .setAction(async (_, hre) => {
    const deploymentsRoot = hre.config.paths.deployments;
    const networks = hre.config.networks
    const depDirs = (await getSubdirectories(deploymentsRoot)).filter(network => !network.includes("hardhat") && !network.includes("testnet") && !network.includes("sepolia"));

    // Table headers
    let markdown = "# Protocol Fees and Ownerships for All Networks\n\n";
    markdown += "| Network | ChainId | ExchangeV2 Address | Fee Receiver | Seller Fee (bps) | Buyer Fee (bps) | ProxyAdmin Owner |\n";
    markdown += "|---------|---------|--------------------|--------------|------------------|-----------------|------------------|\n";

    for (const depDir of depDirs) {
      if(depDir.includes("testnet") || depDir.includes("sepolia"))
        continue;
      const deploymentsDir = path.join(deploymentsRoot, depDir);
      let files: string[] = [];
      let chainId = await getChainIdFromDeployments(deploymentsDir);

      try {
        files = await fs.promises.readdir(deploymentsDir);
      } catch {
        continue; // skip if directory does not exist
      }

      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const deployInfo = JSON.parse(await fs.promises.readFile(path.join(deploymentsDir, file), "utf-8"));
        const contractName = deployInfo.contractName || file.replace(/\.json$/, "");
        if (contractName !== "ExchangeV2" && contractName !== "ExchangeMetaV2" ) continue;
        const address = deployInfo.address;
        let row = `| ${depDir} | ${chainId || ""} | \`${address}\``;

        try {


          let feeReceiver = "";
          let feeSeller = "";
          let feeBuyer = "";
          let owner = "";

          // ABI (TypeChain): protocolFee() returns (receiver, buyerAmount, sellerAmount)
          try {
            const network = networks[depDir] as HttpNetworkConfig;
            const exchange = ExchangeV2__factory.connect(address, new hre.ethers.providers.JsonRpcProvider(network.url));
            owner = await exchange.owner();
            const res = await exchange.protocolFee();
            feeReceiver = res.receiver;
            feeBuyer = res.buyerAmount.toString();
            feeSeller = res.sellerAmount.toString();
          } catch (e) {
            row += " | _Old_ | _Old_ | _Old_ | ";
            markdown += row + (owner ? "`" + owner + "`" : owner.toString()) + "|\n";
            continue;
          }
          row += ` | \`${feeReceiver}\` | ${feeSeller} | ${feeBuyer} | ${owner ? "`" + owner + "`" : owner}`;
        } catch (err) {
          row += " | _Old_ | _Old_ | _Old_ | _Old_";
        }

        row += "|\n";
        markdown += row;
      }
    }

    console.log(markdown);
  });

export default {};