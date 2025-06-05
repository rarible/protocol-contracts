import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// To run this script, run:
// PRIVATE_KEY="[YOUR_PRIVATE_KEY]" yarn ts-node scripts/deployCreateX.ts

// Step 0: Validate PRIVATE_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('❌ PRIVATE_KEY environment variable not set.');
}

// Constants
const CONFIG_FILE = 'chains.json'; // Your source config file
const ETH_DIR = path.join(os.homedir(), '.ethereum'); // Where per-network files will be stored
const DEPLOY_TAG = 'createx'; // Tag for hardhat-deploy
const REPORT_FILE = 'multichain-deployments.md'; // Output Markdown report

interface NetworkConfig {
  name: string;
  network_id: number;
  url: string;
  explorer_url: string;
}

// Step 1: Load JSON config
const networks: NetworkConfig[] = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));

// Step 2: Create ~/.ethereum/[network].json with PRIVATE_KEY
if (!fs.existsSync(ETH_DIR)) {
  fs.mkdirSync(ETH_DIR);
}

for (const net of networks) {
  const filePath = path.join(ETH_DIR, `${net.name}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✔ Config for ${net.name} already exists.`);
    continue;
  }
  const data = { ...net, key: PRIVATE_KEY };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`📁 Created config for ${net.name}`);
}

// Step 3: Deploy using Hardhat for each network
const results: { name: string; address: string | null; explorerUrl: string }[] = [];

for (const net of networks) {
  console.log(`🚀 Deploying to ${net.name}...`);
  try {
    execSync(`yarn hardhat deploy --network ${net.name} --tags ${DEPLOY_TAG}`, {
      stdio: 'inherit',
    });

    // Try to get deployed contract address from deployments
    const deploymentDir = path.join('deployments', net.name);
    const files = fs.readdirSync(deploymentDir).filter(f => f.endsWith('.json') && f !== '.chainId');

    let address: string | null = null;
    if (files.length > 0) {
      const contractData = JSON.parse(fs.readFileSync(path.join(deploymentDir, files[0]), 'utf-8'));
      address = contractData.address;
    }

    results.push({ name: net.name, address, explorerUrl: net.explorer_url });
  } catch (err) {
    console.error(`❌ Failed to deploy to ${net.name}`);
    results.push({ name: net.name, address: null, explorerUrl: net.explorer_url });
  }
}

// Step 4: Generate Markdown report
const lines = [
  '| Network | Contract Address | Explorer Link |',
  '|---------|------------------|----------------|',
  ...results.map(({ name, address, explorerUrl }) => {
    const addr = address ?? 'N/A';
    const link = address ? `${explorerUrl}${address}` : 'N/A';
    return `| ${name} | ${addr} | ${link} |`;
  }),
];

fs.writeFileSync(REPORT_FILE, lines.join('\n'));
console.log(`📄 Report saved to ${REPORT_FILE}`);
