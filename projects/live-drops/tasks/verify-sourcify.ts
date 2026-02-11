import { task } from "hardhat/config";
import https from "https";
import path from "path";
import fs from "fs";

const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

/**
 * Verify a contract on both Sourcify and BaseScan.
 *
 * Usage:
 *   npx hardhat verify:sourcify --address 0x... --contract LiveDropFactory --network base
 *   npx hardhat verify:sourcify --address 0x... --contract LiveDropCollection --constructor-args 0x... --network base
 */
task("verify:sourcify", "Verify a contract on Sourcify and BaseScan")
  .addParam("address", "Deployed contract address")
  .addParam("contract", "Contract name (LiveDropFactory or LiveDropCollection)")
  .addOptionalParam("constructorArgs", "ABI-encoded constructor arguments (hex, no 0x prefix)", "")
  .setAction(async (args, hre) => {
    const { address, contract: contractName, constructorArgs } = args;
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;

    console.log(`\nVerifying ${contractName} at ${address} on chain ${chainId}...`);

    // Find metadata and solc input in build-info
    const buildInfoDir = path.join(hre.config.paths.artifacts, "build-info");
    const buildFiles = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith(".json"));

    let metadata: string | null = null;
    let solcInput: any = null;
    let solcVersion: string | null = null;
    let sourceName: string | null = null;

    for (const buildFile of buildFiles) {
      const buildData = JSON.parse(
        fs.readFileSync(path.join(buildInfoDir, buildFile), "utf-8")
      );
      const contracts = buildData?.output?.contracts || {};

      for (const [sName, sourceContracts] of Object.entries(contracts)) {
        const contractData = (sourceContracts as any)[contractName];
        if (contractData?.metadata) {
          metadata = contractData.metadata;
          solcInput = buildData.input;
          solcVersion = buildData.solcLongVersion;
          sourceName = sName;
          console.log(`Found metadata in ${buildFile} (solc ${solcVersion})`);
          break;
        }
      }
      if (metadata) break;
    }

    if (!metadata || !solcInput || !solcVersion || !sourceName) {
      throw new Error(
        `Metadata for ${contractName} not found. Run 'npx hardhat compile' first.`
      );
    }

    // === 1. Verify on Sourcify ===
    console.log("\n--- Sourcify Verification ---");
    try {
      const sourcifyResult = await verifySourcify(address, chainId.toString(), metadata);
      console.log(`Sourcify: ${sourcifyResult}`);
    } catch (err: any) {
      console.error(`Sourcify failed: ${err.message || err}`);
    }

    // === 2. Verify on BaseScan (Etherscan V2 API) ===
    console.log("\n--- BaseScan Verification ---");
    try {
      const basescanResult = await verifyBaseScan(
        address,
        chainId,
        solcInput,
        `${sourceName}:${contractName}`,
        `v${solcVersion}`,
        constructorArgs
      );
      console.log(`BaseScan: ${basescanResult}`);
    } catch (err: any) {
      console.error(`BaseScan failed: ${err.message || err}`);
    }
  });

/**
 * Verify on Sourcify via multipart POST
 */
async function verifySourcify(
  address: string,
  chainId: string,
  metadata: string
): Promise<string> {
  const boundary = "----SourcifyBoundary" + Date.now();
  let body = "";

  body += `--${boundary}\r\nContent-Disposition: form-data; name="address"\r\n\r\n${address}\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="chain"\r\n\r\n${chainId}\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="metadata.json"\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`;
  body += `--${boundary}--\r\n`;

  const bodyBuffer = Buffer.from(body, "utf-8");

  const result = await httpPost("sourcify.dev", "/server/verify", bodyBuffer, {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
  });

  try {
    const parsed = JSON.parse(result);
    if (parsed.result?.[0]?.status) {
      return `✅ ${parsed.result[0].status}`;
    }
    return parsed.error || result.substring(0, 200);
  } catch {
    return result.substring(0, 200);
  }
}

/**
 * Verify on BaseScan via Etherscan V2 API
 */
async function verifyBaseScan(
  address: string,
  chainId: number,
  solcInput: any,
  contractName: string,
  compilerVersion: string,
  constructorArgs: string
): Promise<string> {
  // Submit verification
  const params = new URLSearchParams({
    apikey: BASESCAN_API_KEY,
    module: "contract",
    action: "verifysourcecode",
    contractaddress: address,
    sourceCode: JSON.stringify(solcInput),
    codeformat: "solidity-standard-json-input",
    contractname: contractName,
    compilerversion: compilerVersion,
    constructorArguements: constructorArgs,
  });

  const submitBody = Buffer.from(params.toString(), "utf-8");
  const submitResult = await httpPost(
    "api.etherscan.io",
    `/v2/api?chainid=${chainId}`,
    submitBody,
    { "Content-Type": "application/x-www-form-urlencoded" }
  );

  const submitParsed = JSON.parse(submitResult);
  if (submitParsed.status !== "1") {
    return `❌ Submit failed: ${submitParsed.result}`;
  }

  const guid = submitParsed.result;
  console.log(`Submitted, GUID: ${guid}. Waiting for verification...`);

  // Poll for result (max 60 seconds)
  for (let i = 0; i < 6; i++) {
    await sleep(10000);
    const checkResult = await httpGet(
      `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${BASESCAN_API_KEY}`
    );
    const checkParsed = JSON.parse(checkResult);

    if (checkParsed.result === "Pending in queue") {
      console.log(`  Still pending... (${(i + 1) * 10}s)`);
      continue;
    }

    if (checkParsed.status === "1") {
      return `✅ ${checkParsed.result}`;
    }

    return `❌ ${checkParsed.result}`;
  }

  return `⏳ Verification still pending after 60s. GUID: ${guid}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpPost(
  hostname: string,
  path: string,
  body: Buffer,
  headers: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "POST", headers: { ...headers, "Content-Length": body.length } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}
