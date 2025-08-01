import { task } from "hardhat/config";

task("set-platform-fee-info", "Sets platform fee info on a compatible drop contract")
  .addParam("contract", "The address of the deployed contract")
  .addParam("recipient", "The recipient of the platform fees")
  .addParam("bps", "The bps for the platform fees")
  .addOptionalParam("from", "The signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { setPlatformFeeInfo } = await import("../sdk");

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Setting platform fees on ${args.contract} using ${signerAddress}`);

    await setPlatformFeeInfo(args.contract, args.recipient, args.bps, signer);
  });
