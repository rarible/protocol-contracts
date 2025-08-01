import { task } from "hardhat/config";

task("set-royalty-info", "Sets royalty info on a compatible drop contract")
  .addParam("contract", "The address of the deployed contract")
  .addParam("recipient", "The recipient of the royalties")
  .addParam("bps", "The bps for royalties")
  .addOptionalParam("from", "The signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { setRoyaltyInfo } = await import("../sdk");

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Setting royalty info on ${args.contract} using ${signerAddress}`);

    await setRoyaltyInfo(args.contract, args.recipient, args.bps, signer);
  });
