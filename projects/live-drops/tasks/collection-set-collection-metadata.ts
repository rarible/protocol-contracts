import { task } from "hardhat/config";

task("collection:set-collection-metadata", "Update collection-level metadata")
  .addParam("address", "Collection contract address")
  .addParam("description", "New collection description")
  .addParam("icon", "New collection icon URL")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.setCollectionMetadata(args.description, args.icon);
  });
