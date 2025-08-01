import { task } from "hardhat/config";

task("set-contract-uri", "Sets platform fee info on a compatible drop contract")
  .addParam("contract", "The address of the deployed contract")
  .addParam("uri", "The recipient of the platform fees")
  .addOptionalParam("from", "The signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { setContractURI } = await import("../sdk");

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Setting contractURI on ${args.contract} using ${signerAddress}`);

    await setContractURI(args.contract, args.uri, signer);
  });
