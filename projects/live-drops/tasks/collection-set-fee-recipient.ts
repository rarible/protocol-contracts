import { task } from "hardhat/config";

task("collection:set-fee-recipient", "Update fee recipient (factory owner only)")
  .addParam("address", "Collection contract address")
  .addParam("recipient", "New fee recipient address")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.setFeeRecipient(args.recipient);
  });
