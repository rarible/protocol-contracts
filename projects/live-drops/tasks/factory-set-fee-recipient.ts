import { task } from "hardhat/config";

task("factory:set-fee-recipient", "Update factory fee recipient")
  .addParam("factory", "Factory contract address")
  .addParam("recipient", "New fee recipient address")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = FactoryClient.connect(args.factory, signers[0]);
    await client.setFeeRecipient(args.recipient);
  });
