import { task } from "hardhat/config";

task("collection:unpause", "Unpause minting on a collection")
  .addParam("address", "Collection contract address")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.unpause();
  });
