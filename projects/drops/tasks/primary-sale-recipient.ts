import { task } from "hardhat/config";

task("primarySaleRecipient", "Get the primary sale recipient from a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { primarySaleRecipient } = await import("../sdk");

    try {
      const recipient = await primarySaleRecipient(args.contract, signer);
      console.log(`Primary sale recipient: ${recipient}`);
    } catch (error) {
      console.error("Error fetching primary sale recipient:", error);
    }
  });
