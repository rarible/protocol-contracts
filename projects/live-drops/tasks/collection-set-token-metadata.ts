import { task } from "hardhat/config";

task("collection:set-token-metadata", "Update shared token metadata")
  .addParam("address", "Collection contract address")
  .addParam("name", "Token metadata name")
  .addParam("description", "Token metadata description")
  .addParam("image", "Token metadata image URL")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.setTokenMetadata(args.name, args.description, args.image);
  });
