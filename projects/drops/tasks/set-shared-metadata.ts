import { task } from "hardhat/config";

task("set-shared-metadata", "Sets shared metadata on a compatible drop contract")
  .addParam("contract", "The address of the deployed contract")
  .addParam("name", "The name field for shared metadata")
  .addParam("description", "The description field for shared metadata")
  .addParam("imageuri", "The image URI")
  .addParam("animationuri", "The animation URI")
  .addOptionalParam("from", "The signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { setSharedMetadata } = await import("../sdk");

    const metadata = {
      name: args.name,
      description: args.description,
      imageURI: args.imageuri,
      animationURI: args.animationuri,
    };

    const contractAddress = args.contract;

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Setting shared metadata on ${contractAddress} using ${signerAddress}`);
    console.log("Metadata:", metadata);

    const receipt = await setSharedMetadata(contractAddress, metadata, signer);

    console.log(`✅ Metadata updated. Tx hash: ${receipt.transactionHash}`);
  });
