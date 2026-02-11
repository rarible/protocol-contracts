import { task } from "hardhat/config";

task("factory:defaults:get", "Get factory default configuration")
  .addParam("factory", "Factory contract address")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = FactoryClient.connect(args.factory, signers[0]);
    const defaults = await client.getDefaults();
    const owner = await client.getOwner();

    console.log("\n=== Factory Defaults ===");
    console.log(`  Owner:              ${owner}`);
    console.log(`  Fee Recipient:      ${defaults.feeRecipient}`);
    console.log(`  Fee BPS:            ${defaults.feeBps} (${defaults.feeBps / 100}%)`);
    console.log(`  Fixed Native Fee:   ${defaults.feeFixedNative} wei`);
    console.log(`  Fixed ERC-20 Fee:   ${defaults.feeFixedErc20}`);
    console.log(`  Default ERC-20:     ${defaults.erc20}`);
    console.log("");
  });
