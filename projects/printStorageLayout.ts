import fs from "fs";
import path from "path";

const TARGET_CONTRACT = process.argv[2];

if (!TARGET_CONTRACT) {
  console.error("❌ Error: Please provide the target contract name as an argument.");
  console.error(`Usage: yarn run print-storage-layout <ContractName>`);
  process.exit(1);
}

const buildInfoPath = path.join(process.cwd(), "artifacts/build-info");

const files = fs.readdirSync(buildInfoPath);

for (const file of files) {
  const fullPath = path.join(buildInfoPath, file);
  const buildInfo = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  for (const source in buildInfo.output.contracts) {
    for (const contractName in buildInfo.output.contracts[source]) {
      if (contractName !== TARGET_CONTRACT) continue;
      const contract = buildInfo.output.contracts[source][contractName];
      const layout = contract.storageLayout;
      if (layout?.storage?.length > 0) {
        console.log(`\nStorage layout for ${contractName} (${source}):`);
        for (const variable of layout.storage) {
          console.log(
            `  Slot ${variable.slot} | Offset ${variable.offset} | Name ${variable.label} | Type ${variable.type}`
          );
        }
      }
    }
  }
}
