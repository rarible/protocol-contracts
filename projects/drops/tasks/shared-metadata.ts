import { task } from "hardhat/config";

task("sharedMetadata", "Get the shared metadata from a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { sharedMetadata } = await import("../sdk");

    try {
      const metadata = await sharedMetadata(args.contract, signer);
      console.log("Shared Metadata:", metadata);
    } catch (error) {
      console.error("Error fetching shared metadata:", error);
    }
  });
