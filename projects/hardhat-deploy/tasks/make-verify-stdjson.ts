// <ai_context>
// Hardhat task to generate a Solidity Standard-JSON-Input file with
// *literal* `content` for every source (no URL fields), suitable for
// Etherscan-style verification that rejects URL-based sources.
// It accepts a hardhat-deploy style JSON (like your example) and:
// 1) If deployments/solcInputs/<solcInputHash>.json exists, uses it,
//    ensuring every source has `content` (not `urls`).
// 2) Otherwise reconstructs the input by reading files from the workspace
//    and node_modules based on metadata.sources keys.
// Optionally, with --allow-fetch, it will try to pull missing sources
// from public IPFS/Swarm HTTP gateways as a last resort.
// </ai_context>

import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import https from "https";

type MakeStdJsonArgs = {
  file: string;
  out?: string;
  deploymentsDir?: string;
  allowFetch?: boolean;
};

type SourceInfo = {
  content?: string;
  keccak256?: string;
  license?: string;
  urls?: string[];
};

function readJSON(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fileExists(p: string) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function resolveLocalPath(rel: string): string | null {
  const candidates = [
    path.resolve(rel),
    path.resolve("contracts", rel),
    path.resolve("src", rel),
    path.resolve("node_modules", rel),
  ];
  for (const c of candidates) {
    if (fileExists(c)) return c;
  }
  return null;
}

function fetchHttps(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if ((res.statusCode || 0) >= 300 && (res.statusCode || 0) < 400 && res.headers.location) {
          // follow redirect once
          fetchHttps(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(Buffer.from(d)));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

async function tryFetchFromUrls(urls: string[]): Promise<string | null> {
  for (const u of urls) {
    try {
      if (u.startsWith("dweb:/ipfs/")) {
        const cid = u.replace("dweb:/ipfs/", "");
        const data = await fetchHttps(`https://ipfs.io/ipfs/${cid}`);
        return data;
      }
      if (u.startsWith("bzz-raw://")) {
        const hash = u.replace("bzz-raw://", "");
        const data = await fetchHttps(`https://swarm-gateways.net/bzz-raw:/${hash}`);
        return data;
      }
      if (u.startsWith("http://") || u.startsWith("https://")) {
        const data = await fetchHttps(u);
        return data;
      }
      // ignore unsupported schemes silently
    } catch {
      // try next url
    }
  }
  return null;
}

async function buildLiteralSources(
  metaSources: Record<string, SourceInfo>,
  seed?: Record<string, SourceInfo>,
  allowFetch = false
): Promise<Record<string, { content: string }>> {
  const out: Record<string, { content: string }> = {};
  const entries = Object.entries(metaSources || {});
  for (const [sourcePath, info] of entries) {
    // 1) If seed has content, prefer it
    const seeded = seed?.[sourcePath];
    if (seeded?.content && typeof seeded.content === "string" && seeded.content.length > 0) {
      out[sourcePath] = { content: seeded.content };
      continue;
    }

    // 2) Try resolve from local filesystem / node_modules
    const local = resolveLocalPath(sourcePath);
    if (local) {
      const content = fs.readFileSync(local, "utf8");
      out[sourcePath] = { content };
      continue;
    }

    // 3) Optionally try network fetch via metadata.urls
    if (allowFetch && info?.urls && info.urls.length > 0) {
      const fetched = await tryFetchFromUrls(info.urls);
      if (fetched) {
        out[sourcePath] = { content: fetched };
        continue;
      }
    }

    // 4) As an absolute last resort, write empty to fail loudly on explorer
    out[sourcePath] = { content: "" };
  }
  return out;
}

task("etherscan-make-stdjson", "Create a Standard-JSON-Input with literal sources for Etherscan verification")
  .addParam("file", "Path to hardhat-deploy style JSON (the deployment result with `metadata.solc_metadata`)")
  .addOptionalParam("out", "Output path for the generated standard JSON input")
  .addOptionalParam("deploymentsDir", "Deployments dir to look for solcInputs cache", "deployments")
  .addFlag("allowFetch", "Try public gateways for missing sources (IPFS/Swarm)")
  .setAction(async (args: MakeStdJsonArgs, hre: HardhatRuntimeEnvironment) => {
    const inputJson = readJSON(args.file);

    const metaStr: string | undefined =
      inputJson?.metadata?.solc_metadata || inputJson?.metadata?.solcMetadata;
    if (!metaStr) {
      throw new Error(`No metadata.solc_metadata found in ${args.file}`);
    }
    const meta = JSON.parse(metaStr);
    const solcVersion: string = meta?.compiler?.version || "unknown";
    const evmVersion: string | undefined = meta?.settings?.evmVersion;

    // Try cached full solc input first
    const hash: string | undefined = inputJson?.solcInputHash;
    let stdInput: any | undefined;

    if (hash) {
      const cached = path.join(args.deploymentsDir!, "solcInputs", `${hash}.json`);
      if (fileExists(cached)) {
        const cachedInput = readJSON(cached);
        // Ensure literal content for every source
        const literalSources = await buildLiteralSources(
          meta.sources || {},
          cachedInput.sources || {},
          !!args.allowFetch
        );
        stdInput = {
          language: cachedInput.language || meta.language || "Solidity",
          sources: literalSources,
          settings: cachedInput.settings || meta.settings || {},
        };
      }
    }

    // If no cache or fallback needed, build from metadata + local files
    if (!stdInput) {
      const literalSources = await buildLiteralSources(
        meta.sources || {},
        undefined,
        !!args.allowFetch
      );
      stdInput = {
        language: meta.language || "Solidity",
        sources: literalSources,
        settings: meta.settings || {},
      };
    }

    // Pick output path
    const compTarget = stdInput.settings?.compilationTarget || meta.settings?.compilationTarget || {};
    const fqn =
      Object.keys(compTarget).length > 0
        ? `${Object.keys(compTarget)[0]}:${Object.values(compTarget)[0]}`
        : "(unknown)";

    const suggested =
      args.out ||
      path.join(
        "verify",
        `${(Object.values(compTarget)[0] as string | undefined) || "contract"}-${hre.network.name}-standard-input.literal.json`
      );

    ensureDir(path.dirname(suggested));
    fs.writeFileSync(suggested, JSON.stringify(stdInput, null, 2));

    console.log(`Wrote ${suggested}`);
    console.log(`Compiler: ${solcVersion}${evmVersion ? ` | EVM: ${evmVersion}` : ""}`);
    console.log(`FQN: ${fqn}`);
    console.log(`Sources: ${Object.keys(stdInput.sources || {}).length} (all literal content)`);
  });