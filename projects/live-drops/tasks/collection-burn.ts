import { task } from "hardhat/config";

task("collection:burn", "Burn an NFT")
  .addParam("address", "Collection contract address")
  .addParam("tokenId", "Token ID to burn")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.burn(parseInt(args.tokenId));
  });
