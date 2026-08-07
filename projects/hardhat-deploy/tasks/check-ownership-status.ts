import { task } from "hardhat/config";
import * as fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { ExchangeV2__factory } from "@rarible/exchange-v2/typechain-types";
import { HttpNetworkConfig } from "hardhat/types";
import { ethers } from "ethers";

/**
 * Read-only task: checks Exchange ownership and fee status across all configured networks.
 * Produces a Markdown report table.
 *
 * npx hardhat check-ownership-status
 */

const NEW_OWNER_BY_CHAIN_ID: Record<number, { network: string; newOwner: string }> = {
  56:         { network: "bsc",              newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  4663:       { network: "robinhood",        newOwner: "0x6031ecbd7D65e805A72f506D0fb841088E49fAe7" },
  4326:       { network: "megaeth",          newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  8453:       { network: "base",             newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b8" },
  1380012617: { network: "rari",             newOwner: "0xf37867d72445332915083D76777daF3639Bde26E" },
  137:        { network: "polygon_mainnet",  newOwner: "0x735092f168faedeEba11edaA765455ecff3C53B9" },
  33139:      { network: "apechain",         newOwner: "0xD39c38cc73dA45773D48f1cE330dF61769f0BAA6" },
  5031:       { network: "somnia",           newOwner: "0x04a2684A46934504a62BdF9947AF166F01bf14F8" },
  999:        { network: "hyper_evm",        newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b10" },
  7897:       { network: "arenaz",           newOwner: "0x04a2684A46934504a62BdF9947AF166F01bf14F8" },
  1890:       { network: "lightlink",        newOwner: "0x1943756057cBb3A858CC7cF4A25A7A35BdCa4eDb" },
  1284:       { network: "moonbeam",         newOwner: "0x2dF7343e2bDeA99ecf9863915876bc841b8E76bB" },
  320:        { network: "zkcandy",          newOwner: "0x04a2684A46934504a62BdF9947AF166F01bf14F8" },
  42793:      { network: "etherlink",        newOwner: "0x2dF7343e2bDeA99ecf9863915876bc841b8E76bB" },
  32769:      { network: "zilliqa",          newOwner: "0x04a2684A46934504a62BdF9947AF166F01bf14F8" },
  360:        { network: "shape",            newOwner: "0x2dF7343e2bDeA99ecf9863915876bc841b8E76bB" },
  1776:       { network: "injective",        newOwner: "0xeaD5aA8630e03C95c6D7c83c1FD1EA2C6749E4D7" },
  52014:      { network: "electroneum",      newOwner: "0x04a2684A46934504a62BdF9947AF166F01bf14F8" },
  484:        { network: "camp",             newOwner: "0xD39c38cc73dA45773D48f1cE330dF61769f0BAA6" },
  40:         { network: "telos",            newOwner: "0x10B070b01284a1405faa3a633697547d3db2b38d" },
  252:        { network: "fraxtal",          newOwner: "0x0e8b44Ac9675518Ec436a66c6654C9Df03b4c2f4" },
  698:        { network: "match",            newOwner: "0x4471FC5378aAf93fE271f2402A087FBeB1c66532" },
  295:        { network: "hedera",           newOwner: "0x04a2684A46934504a62BdF9947AF166F01bf14F8" },
  88888:      { network: "chiliz",           newOwner: "0x6f23c7028ccd82b850291e33ea793dDfC885E3E3" },
  2741:       { network: "abstract",         newOwner: "0xdD650Ffc2A089324e8d36B5a6Dd859c96A8564Df" },
  42161:      { network: "arbitrum",         newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  80094:      { network: "berachain",        newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  42220:      { network: "celo",             newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  143:        { network: "monad",            newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  5000:       { network: "mantle_mainnet",   newOwner: "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7" },
  324:        { network: "zksync",           newOwner: "0x86ddc6cB0e94158AFD6DA3ae53a6Ec6182434AEB" },
  1329:       { network: "sei",              newOwner: "0xA9F422E8A794b631Ab0B6d03f17c5eA288623bBC" },
  660279:     { network: "xai",              newOwner: "0xD1dF6f70DAE06cfabCc02158D7beAEab75f8f8C6" },
};

const EXCHANGE_CONTRACT_NAMES = ["ExchangeV2", "ExchangeMetaV2"];

async function getChainIdFromDeployments(deploymentsDir: string): Promise<string | undefined> {
  const chainIdFile = path.join(deploymentsDir, ".chainId");
  try {
    if (fs.existsSync(chainIdFile)) {
      return (await fsPromises.readFile(chainIdFile, "utf-8")).trim();
    }
  } catch {}
  return undefined;
}

async function findExchangeDeployment(deploymentsDir: string): Promise<{ name: string; address: string } | undefined> {
  try {
    const files = await fsPromises.readdir(deploymentsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const deployInfo = JSON.parse(await fsPromises.readFile(path.join(deploymentsDir, file), "utf-8"));
      const contractName = deployInfo.contractName || file.replace(/\.json$/, "");
      if (EXCHANGE_CONTRACT_NAMES.includes(contractName) && deployInfo.address) {
        return { name: contractName, address: deployInfo.address };
      }
    }
  } catch {}
  return undefined;
}

interface NetworkReport {
  network: string;
  chainId: string;
  exchangeContract: string;
  exchangeAddress: string;
  currentOwner: string;
  targetOwner: string;
  ownershipStatus: string;
  sellerFee: string;
  buyerFee: string;
  feeStatus: string;
  error: string;
}

task("check-ownership-status", "Read-only: check Exchange ownership and fee status across all networks")
  .setAction(async (_args, hre) => {
    const deploymentsRoot = hre.config.paths.deployments;
    const networks = hre.config.networks;
    const reports: NetworkReport[] = [];

    for (const [chainIdStr, config] of Object.entries(NEW_OWNER_BY_CHAIN_ID)) {
      const { network: networkName, newOwner } = config;
      const deploymentsDir = path.join(deploymentsRoot, networkName);

      const report: NetworkReport = {
        network: networkName,
        chainId: chainIdStr,
        exchangeContract: "-",
        exchangeAddress: "-",
        currentOwner: "-",
        targetOwner: newOwner,
        ownershipStatus: "-",
        sellerFee: "-",
        buyerFee: "-",
        feeStatus: "-",
        error: "",
      };

      const networkConfig = networks[networkName] as HttpNetworkConfig | undefined;
      if (!networkConfig || !networkConfig.url) {
        report.error = "No RPC configured";
        reports.push(report);
        continue;
      }

      const exchangeDeploy = await findExchangeDeployment(deploymentsDir);
      if (!exchangeDeploy) {
        report.error = "No Exchange deployment found";
        reports.push(report);
        continue;
      }

      report.exchangeContract = exchangeDeploy.name;
      report.exchangeAddress = exchangeDeploy.address;

      try {
        const provider = new hre.ethers.providers.JsonRpcProvider(networkConfig.url);
        const exchange = ExchangeV2__factory.connect(exchangeDeploy.address, provider);

        const currentOwner = await exchange.owner();
        report.currentOwner = currentOwner;

        if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
          report.ownershipStatus = "DONE";
        } else {
          report.ownershipStatus = "PENDING";
        }

        try {
          const fee = await exchange.protocolFee();
          report.sellerFee = fee.sellerAmount.toString();
          report.buyerFee = fee.buyerAmount.toString();
          if (fee.sellerAmount == 0 && fee.buyerAmount == 0) {
            report.feeStatus = "ZERO";
          } else {
            report.feeStatus = "NON-ZERO";
          }
        } catch {
          report.feeStatus = "OLD CONTRACT";
        }
      } catch (err: any) {
        report.error = err.reason || err.message || String(err);
      }

      reports.push(report);
    }

    // --- Markdown report ---
    console.log("\n# Ownership & Fee Transfer Status Report\n");
    console.log("| Network | ChainId | Exchange | Current Owner | Target Owner | Ownership | Seller Fee | Buyer Fee | Fee Status | Error |");
    console.log("|---------|---------|----------|---------------|--------------|-----------|------------|-----------|------------|-------|");
    for (const r of reports) {
      console.log(
        `| ${r.network} | ${r.chainId} | ${r.exchangeContract} ` +
        `| \`${r.currentOwner}\` | \`${r.targetOwner}\` ` +
        `| **${r.ownershipStatus}** | ${r.sellerFee} | ${r.buyerFee} | ${r.feeStatus} ` +
        `| ${r.error || "-"} |`
      );
    }

    // --- Summary by ownership status ---
    const done = reports.filter(r => r.ownershipStatus === "DONE");
    const pending = reports.filter(r => r.ownershipStatus === "PENDING");
    const errored = reports.filter(r => r.ownershipStatus === "-");
    const feesNonZero = reports.filter(r => r.feeStatus === "NON-ZERO");

    console.log(`\n## Summary\n`);
    console.log(`- Total networks: ${reports.length}`);
    console.log(`- Ownership DONE: ${done.length}`);
    console.log(`- Ownership PENDING: ${pending.length}`);
    console.log(`- Errors (could not check): ${errored.length}`);
    console.log(`- Fees still NON-ZERO: ${feesNonZero.length}`);

    if (pending.length > 0) {
      console.log(`\n## Networks still PENDING ownership transfer\n`);
      console.log("| Network | ChainId | Current Owner | Target Owner |");
      console.log("|---------|---------|---------------|--------------|");
      for (const r of pending) {
        console.log(`| ${r.network} | ${r.chainId} | \`${r.currentOwner}\` | \`${r.targetOwner}\` |`);
      }
    }

    if (feesNonZero.length > 0) {
      console.log(`\n## Networks with NON-ZERO fees\n`);
      console.log("| Network | ChainId | Seller Fee | Buyer Fee | Current Owner |");
      console.log("|---------|---------|------------|-----------|---------------|");
      for (const r of feesNonZero) {
        console.log(`| ${r.network} | ${r.chainId} | ${r.sellerFee} | ${r.buyerFee} | \`${r.currentOwner}\` |`);
      }
    }

    if (errored.length > 0) {
      console.log(`\n## Networks with errors\n`);
      console.log("| Network | ChainId | Error |");
      console.log("|---------|---------|-------|");
      for (const r of errored) {
        console.log(`| ${r.network} | ${r.chainId} | ${r.error} |`);
      }
    }
  });

export default {};
