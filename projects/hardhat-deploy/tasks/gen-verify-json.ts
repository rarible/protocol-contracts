// <ai_context>
// Generates a Solidity Standard JSON Input suitable for verifier APIs (Etherscan v2 or zkSync).
// - Reads deployments/<network>/<name>.json (hardhat-deploy format)
// - Prefers cached solc input (deployments/solcInputs/<hash>.json)
// - Otherwise tries to find a matching build-info input (artifacts*/build-info/*) and use its fully inlined "input".
// - If still not found, reconstructs Standard JSON Input and forces inlining from project root and node_modules.
// - Emits both the Standard JSON Input and the original metadata to /verify by default.
// - Also emits explorer-hints with base64-encoded optimizer settings (solc & zksolc).
// - NEW: emits a companion "*.with-optimizer.json" that embeds top-level optimizer settings fields:
//        - optimizer_settings (base64 JSON), optimizer_settings_raw, optimizer_settings_source
// - Prints detected FQN and a ready-to-run verify command using the custom etherscan-verify-cli.
//
// Options:
//   --name <DeploymentName>                Required. Name inside deployments dir (e.g. ExchangeMetaV2)
//   --network-dir <dir>                    Optional. Default: "deployments"
//   --out <path>                           Optional. Output path for standard input JSON
//   --address <addr>                       Optional. Override deployed address; otherwise read from deployment file
//   --contract <fqn>                       Optional. Override fully-qualified name (e.g. @pkg/path.sol:Contract)
//   --inline <bool>                        Optional. Force inline local sources (default: true)
//   --resolve-node-modules <bool>          Optional. Search node_modules for sources (default: true)
// </ai_context>

import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

function readJSON(file: string): any {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function tryRead(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function resolveLocalSource(projectRoot: string, sourceKey: string, opts: { resolveNodeModules: boolean }): { path?: string; content?: string } {
  // 1) try project-relative
  const p1 = path.resolve(projectRoot, sourceKey);
  const c1 = tryRead(p1);
  if (c1 !== undefined) return { path: p1, content: c1 };

  // 2) try node_modules/<key>
  if (opts.resolveNodeModules) {
    const p2 = path.resolve(projectRoot, "node_modules", sourceKey);
    const c2 = tryRead(p2);
    if (c2 !== undefined) return { path: p2, content: c2 };
  }

  return {};
}

function listBuildInfoDirs(root: string): string[] {
  const dirs = [
    path.join(root, "artifacts", "build-info"),
    path.join(root, "artifacts-zk", "build-info"),
  ];
  return dirs.filter((d) => fileExists(d) && fs.statSync(d).isDirectory());
}

function findBuildInfoInputByTarget(root: string, targetFile: string | undefined, targetName: string | undefined): any | undefined {
  if (!targetFile || !targetName) return undefined;
  const dirs = listBuildInfoDirs(root);
  for (const dir of dirs) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const json = readJSON(full);
        const outContracts = json?.output?.contracts ?? {};
        if (outContracts[targetFile] && outContracts[targetFile][targetName]) {
          const input = json?.input;
          const hasAllContent = input && input.sources && Object.values<any>(input.sources).every((s: any) => typeof s?.content === "string");
          if (hasAllContent) {
            return input;
          }
        }
      } catch {
        // ignore corrupted build-info
      }
    }
  }
  return undefined;
}

function b64Json(obj: any): string | undefined {
  try {
    const s = JSON.stringify(obj);
    return Buffer.from(s, "utf8").toString("base64");
  } catch {
    return undefined;
  }
}

task("gen-verify-json", "Create a Solidity Standard-JSON-Input from a hardhat-deploy file (fully inlined, no URLs)")
  .addParam("name", "Deployment name, e.g. ExchangeMetaV2")
  .addOptionalParam("networkDir", "Deployments dir (default: deployments)", "deployments", types.string)
  .addOptionalParam("out", "Output path (default: verify/<name>-<network>-standard-input.json)", "", types.string)
  .addOptionalParam("address", "Deployed address override (default: read from deployment file)", "", types.string)
  .addOptionalParam("contract", "Fully Qualified Name override, e.g. @rarible/exchange-v2/contracts/ExchangeMetaV2.sol:ExchangeMetaV2", "", types.string)
  .addOptionalParam("inline", "Inline local source contents", true, types.boolean)
  .addOptionalParam("resolveNodeModules", "Search node_modules for sources", true, types.boolean)
  .setAction(async (args: {
    name: string;
    networkDir: string;
    out: string;
    address?: string;
    contract?: string;
    inline: boolean;
    resolveNodeModules: boolean;
  }, hre: HardhatRuntimeEnvironment) => {
    const net = hre.network.name;
    const root = hre.config.paths.root;

    const deployFile = path.join(args.networkDir, net, `${args.name}.json`);
    if (!fileExists(deployFile)) {
      throw new Error(`Not found: ${deployFile}`);
    }

    const deploy = readJSON(deployFile);
    const address = (args.address && args.address.length > 0) ? args.address : deploy.address;

    const metaStr: string | undefined =
      deploy?.metadata?.solc_metadata ||
      deploy?.metadata?.solcMetadata ||
      deploy?.metadata; // some setups store raw metadata string directly

    if (!metaStr || typeof metaStr !== "string") {
      throw new Error(`No metadata string in ${deployFile} (expected metadata.solc_metadata or metadata.solcMetadata)`);
    }

    const meta = JSON.parse(metaStr);

    // Detect FQN from metadata early for build-info matching
    const compTarget = meta.settings?.compilationTarget || {};
    const targetFile = Object.keys(compTarget)[0];
    const targetName = targetFile ? compTarget[targetFile] : undefined;

    // 1) Try cached Standard JSON input from hardhat-deploy
    const hash: string | undefined = deploy.solcInputHash;
    const solcInputsDir = path.join(args.networkDir, "solcInputs");
    const cachedInputPath = hash ? path.join(solcInputsDir, `${hash}.json`) : undefined;

    let stdInput: any | undefined;

    if (cachedInputPath && fileExists(cachedInputPath)) {
      const cached = readJSON(cachedInputPath);
      const hasAllContent = cached?.sources && Object.values<any>(cached.sources).every((s: any) => typeof s?.content === "string");
      if (hasAllContent) {
        stdInput = cached;
      }
    }

    // 2) Try to find a matching build-info input (fully inlined)
    if (!stdInput) {
      const biInput = findBuildInfoInputByTarget(root, targetFile, targetName);
      if (biInput) {
        stdInput = biInput;
      }
    }

    // 3) Reconstruct and FORCE inline if still not found
    if (!stdInput) {
      const metaSources: Record<string, any> = meta.sources || {};
      const settings = meta.settings || {};
      const sources: Record<string, any> = {};
      const missing: string[] = [];

      for (const [srcPath] of Object.entries<any>(metaSources)) {
        let added = false;

        if (args.inline) {
          const resolved = resolveLocalSource(root, srcPath, { resolveNodeModules: args.resolveNodeModules });
          if (resolved.content !== undefined) {
            sources[srcPath] = { content: resolved.content };
            added = true;
          }
        }

        if (!added) {
          missing.push(srcPath);
        }
      }

      if (missing.length > 0) {
        const hints = [
          `Missing ${missing.length} source file(s) for full inlining:`,
          ...missing.map((m) => ` - ${m}`),
          "",
          "Fix suggestions:",
          " • Ensure all deps are installed (node_modules) and compiled: `npx hardhat compile`.",
          " • Verify the source path keys match on disk (case-sensitive).",
          " • If sources come from an external package, ensure the package version matches the one used at deploy time.",
          "This task intentionally refuses to emit URL-based sources to avoid explorer rejection.",
        ].join("\n");
        throw new Error(hints);
      }

      stdInput = {
        language: meta.language || "Solidity",
        sources,
        settings,
      };
    }

    // Emit files (fully inlined)
    const defaultOut =
      (args.out && args.out.length > 0)
        ? args.out
        : path.join("verify", `${args.name}-${net}-standard-input.json`);

    const outFile = defaultOut;
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(stdInput, null, 2));

    const metaOut = path.join("verify", `${args.name}-${net}-metadata.json`);
    fs.mkdirSync(path.dirname(metaOut), { recursive: true });
    fs.writeFileSync(metaOut, JSON.stringify(meta, null, 2));

    // Final FQN
    const compTarget2 = stdInput.settings?.compilationTarget || meta.settings?.compilationTarget || {};
    let fqnDetected = "(unknown)";
    const targetFile2 = Object.keys(compTarget2)[0];
    const targetName2 = targetFile2 ? compTarget2[targetFile2] : undefined;
    if (targetFile2 && targetName2) {
      fqnDetected = `${targetFile2}:${targetName2}`;
    }
    const fqn = (args.contract && args.contract.length > 0) ? args.contract : fqnDetected;

    // Explorer hints (optimizer base64s)
    const solcOptimizer = meta.settings?.optimizer;
    const zksolcOptimizer = (hre.config as any)?.zksolc?.settings?.optimizer;
    const solcOptimizerB64 = b64Json(solcOptimizer);
    const zksolcOptimizerB64 = b64Json(zksolcOptimizer);

    const hintsOut = path.join("verify", `${args.name}-${net}-explorer-hints.json`);
    const hintsPayload = {
      network: net,
      address,
      contract: fqn,
      solc_version: meta?.compiler?.version,
      evm_version: meta?.settings?.evmVersion,
      optimizer: solcOptimizer,
      optimizer_settings_b64_solc: solcOptimizerB64,
      zksolc_version: (hre.config as any)?.zksolc?.version,
      zksolc_optimizer: zksolcOptimizer,
      optimizer_settings_b64_zksolc: zksolcOptimizerB64,
    };
    fs.mkdirSync(path.dirname(hintsOut), { recursive: true });
    fs.writeFileSync(hintsOut, JSON.stringify(hintsPayload, null, 2));

    // NEW: also write a variant with optimizer settings embedded
    const isZk = Boolean((hre.network.config as any).zksync);
    const chosenOpt = isZk ? zksolcOptimizer : solcOptimizer;
    const chosenSrc = isZk ? "zksolc" : "solc";
    const chosenB64 = b64Json(chosenOpt);

    const withOpt = {
      ...stdInput,
      optimizer_settings_source: chosenSrc,
      optimizer_settings_raw: chosenOpt ?? null,
      optimizer_settings: chosenB64 ?? null,
    };

    const outWithOpt =
      outFile.endsWith(".json")
        ? outFile.replace(/\.json$/i, ".with-optimizer.json")
        : outFile + ".with-optimizer.json";

    fs.writeFileSync(outWithOpt, JSON.stringify(withOpt, null, 2));

    console.log(`Wrote ${outFile}`);
    console.log(`Wrote ${outWithOpt}`);
    console.log(`Wrote ${metaOut}`);
    console.log(`Wrote ${hintsOut}`);
    console.log(`FQN: ${fqn}`);
    console.log(`Address: ${address}`);

    if (solcOptimizerB64) {
      console.log(`optimizer_settings_b64_solc: ${solcOptimizerB64}`);
    }
    if (zksolcOptimizerB64) {
      console.log(`optimizer_settings_b64_zksolc: ${zksolcOptimizerB64}`);
    }

    // Suggest verification command using the enhanced task
    const baseCmd = [
      "npx hardhat etherscan-verify-cli",
      `--network ${net}`,
      isZk ? "--config zk.hardhat.config.ts" : "",
      `--contract ${fqn}`,
      address
    ].filter(Boolean).join(" ");

    console.log("\nSuggested verify command:");
    console.log(baseCmd);
    console.log("\nNote:");
    console.log("- Use the '*.with-optimizer.json' variant if your explorer expects a top-level 'optimizer_settings' field.");
    console.log("- The base 'standard-input.json' remains pure Standard JSON Input (unknown fields omitted).");
    console.log("- For zkSync-like networks, pass the explorer verification URL via --api-url if required.");
    console.log("- For Etherscan-style networks, pass your single v2 API key via --api-key and the v2 endpoint via --api-url if needed.");
  });