import fs from "fs";
import path from "path";

export function logDeployment(
  network: string,
  deploymentType: string,
  address: string,
  name: string,
  baseUri: string,
  deployer: string
) {
  const dirPath = path.join(__dirname, "..", "deployments", network);
  const filePath = path.join(dirPath, "drops.csv");

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fileExists = fs.existsSync(filePath);
  const timestamp = new Date().toISOString();

  const headers = [
    "type",
    "address",
    "name",
    "baseUri",
    "deployer",
    "timestamp"
  ];

  const row = [deploymentType, address, name, baseUri, deployer, timestamp]
    .map((val) => `"${val.replace(/"/g, '""')}"`) // escape quotes
    .join(",");

  const line = (fileExists ? "" : headers.join(",") + "\n") + row + "\n";

  fs.appendFileSync(filePath, fileExists ? row + "\n" : line, "utf-8");
}
