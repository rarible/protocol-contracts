import { task } from "hardhat/config";

task("collection:set-royalty", "Update ERC-2981 royalty configuration")
  .addParam("address", "Collection contract address")
  .addParam("receiver", "Royalty receiver address")
  .addParam("bps", "Royalty basis points (0-10000)")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.setRoyalty(args.receiver, parseInt(args.bps));
  });
