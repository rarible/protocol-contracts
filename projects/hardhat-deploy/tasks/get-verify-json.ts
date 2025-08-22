import { task } from "hardhat/config";
import fs from "fs";
import path from "path";

task("gen-verify-json", "Create a Solidity Standard-JSON-Input from a hardhat-deploy file")
  .addParam("name", "Deployment name, e.g. ExchangeMetaV2")
  .addOptionalParam("networkDir", "Deployments dir (default: deployments)", "deployments")
  .addOptionalParam("out", "Output path", "")
  .setAction(async (args, hre) => {
    const net = hre.network.name;
    const deployFile = path.join(args.networkDir, net, `${args.name}.json`);
    if (!fs.existsSync(deployFile)) throw new Error(`Not found: ${deployFile}`);

    const deploy = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    const metaStr =
      deploy?.metadata?.solc_metadata || deploy?.metadata?.solcMetadata;
    if (!metaStr) throw new Error(`No metadata.solc_metadata in ${deployFile}`);

    const meta = JSON.parse(metaStr);

    // Prefer full input if hardhat-deploy cached it
    const hash = deploy.solcInputHash;
    const solcInputsDir = path.join(args.networkDir, "solcInputs");
    const cached = hash
      ? path.join(solcInputsDir, `${hash}.json`)
      : undefined;

    let stdInput: any;
    if (cached && fs.existsSync(cached)) {
      stdInput = JSON.parse(fs.readFileSync(cached, "utf8"));
    } else {
      // Build Standard-JSON-Input using URLs from metadata
      const sources: Record<string, any> = {};
      for (const [p, info] of Object.entries<any>(meta.sources || {})) {
        const entry: any = {};
        if (info.urls) entry.urls = info.urls;
        if (info.license) entry.license = info.license;
        sources[p] = Object.keys(entry).length ? entry : { content: "" };
      }
      stdInput = {
        language: meta.language || "Solidity",
        sources,
        settings: meta.settings || {},
      };
    }

    const outFile =
      args.out ||
      path.join(
        "verify",
        `${args.name}-${net}-standard-input.json`
      );
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(stdInput, null, 2));
    const compTarget = stdInput.settings?.compilationTarget || meta.settings?.compilationTarget || {};
    const fqn = Object.keys(compTarget).length
      ? `${Object.keys(compTarget)[0]}:${Object.values(compTarget)[0]}`
      : "(unknown)";
    console.log(`Wrote ${outFile}`);
    console.log(`FQN: ${fqn}`);
  });
