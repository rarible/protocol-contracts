import { task } from "hardhat/config";

task("set-platform-fee-type", "Sets platform fee info on a compatible drop contract")
  .addParam("contract", "The address of the deployed contract")
  .addParam("type", "The platform fee type: BPS=0, FLAT=1")
  .addOptionalParam("from", "The signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { setPlatformFeeType } = await import("../sdk");

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Setting platform fee type on ${args.contract} using ${signerAddress}`);

    await setPlatformFeeType(args.contract, args.type, signer);
  });
