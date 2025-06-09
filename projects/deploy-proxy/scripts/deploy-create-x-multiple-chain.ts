/*
<ai_context>
Utility script that deploys the RaribleCreateX factory to multiple
Hardhat networks in one go.  It simply shells out to Hardhat-Deploy
for each supplied network tag, so the authoritative deployment logic
remains in deploy/02-deploy-rarible-create-x.ts (tag "RaribleCreateX").
Usage examples:

  # Deploy to sepolia (default)
  npx ts-node scripts/deploy-create-x-multiple-chain.ts

  # Deploy to three networks
  npx ts-node scripts/deploy-create-x-multiple-chain.ts sepolia polygon_mainnet zksync_sepolia
</ai_context>
*/

import { execSync } from "child_process";
import chalk from "chalk"; // chalk is already a transitive dep of Hardhat-Toolbox; safe to import.

/**
 * Deploy RaribleCreateX to a single network using Hardhat-Deploy.
 */
function deployToNetwork(network: string): void {
  const divider = chalk.gray("─".repeat(60));
  console.log(`\n${divider}`);
  console.log(chalk.cyanBright(`🚀  Deploying RaribleCreateX to '${network}'…`));
  console.log(`${divider}\n`);

  try {
    execSync(`npx hardhat deploy --tags RaribleCreateX --network ${network}`, {
      stdio: "inherit",
      env: process.env, // forward env (PRIVATE_KEY, etc.)
    });
    console.log(chalk.greenBright(`\n✅  Deployment finished for '${network}'\n`));
  } catch (err) {
    console.error(
      chalk.redBright(`\n❌  Deployment FAILED for '${network}' – aborting further deployments.\n`)
    );
    throw err;
  }
}

async function main(): Promise<void> {
  // Every positional CLI arg is treated as a network name.
  const networks = process.argv.slice(2);
  if (networks.length === 0) {
    networks.push("sepolia"); // Safe default
  }

  for (const net of networks) {
    await deployToNetwork(net);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});