const fs = require("fs");
const path = require("path");

const contracts = ["Digitoys", "DigitoysBaseERC721", "DigitoysItems"];
const abiDir = path.join(__dirname, "..", "abi");

// Ensure abi directory exists
if (!fs.existsSync(abiDir)) {
  fs.mkdirSync(abiDir, { recursive: true });
}

contracts.forEach((contractName) => {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Filter out unsupported types from ABI (e.g., "error" type)
    if (artifact.abi) {
      artifact.abi = artifact.abi.filter((item) => item.type !== "error");
    }
    
    const outputPath = path.join(abiDir, `${contractName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
    console.log(`Copied artifact: ${outputPath}`);
  } else {
    console.warn(`Artifact not found: ${artifactPath}`);
  }
});

console.log("Artifact extraction complete!");
