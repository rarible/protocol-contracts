import { task } from "hardhat/config";

task("factory:list", "List all collections created by the factory")
  .addParam("factory", "Factory contract address")
  .addOptionalParam("offset", "Start offset", "0")
  .addOptionalParam("limit", "Max results", "50")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = FactoryClient.connect(args.factory, signers[0]);

    const count = await client.getCollectionCount();
    const collections = await client.getCollections(
      parseInt(args.offset),
      parseInt(args.limit)
    );

    console.log(`\n=== Collections (${collections.length} of ${count} total) ===`);
    collections.forEach((addr, i) => {
      console.log(`  ${parseInt(args.offset) + i}: ${addr}`);
    });
    console.log("");
  });
