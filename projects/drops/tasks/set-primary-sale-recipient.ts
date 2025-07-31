import { task } from "hardhat/config";

task("set-primary-sale-recipient", "Sets primary sale recipient on a compatible drop contract")
  .addParam("contract", "The address of the deployed contract")
  .addParam("recipient", "The recipient of the primary sales")
  .addOptionalParam("from", "The signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { setPrimarySaleRecipient } = await import("../sdk");

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Setting primary sale recipient on ${args.contract} using ${signerAddress}`);

    await setPrimarySaleRecipient(args.contract, args.recipient, signer);
  });
