import { task } from "hardhat/config";

task("collection:set-erc20", "Update the ERC-20 payment token")
  .addParam("address", "Collection contract address")
  .addParam("token", "New ERC-20 token address")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.setErc20Token(args.token);
  });
