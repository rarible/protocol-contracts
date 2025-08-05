import { task } from "hardhat/config";

task("getFlatPlatformFeeInfo", "Get the flat platform fee info from a PlatformFee contract")
  .addParam("contract", "The deployed PlatformFee-compatible contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getFlatPlatformFeeInfo } = await import("../sdk");

    try {
      const result = await getFlatPlatformFeeInfo(args.contract, signer);
      console.log("Flat Platform Fee Info:", result);
    } catch (error) {
      console.error("Error fetching flat platform fee info:", error);
    }
  });

task("getPlatformFeeInfo", "Get the platform fee info (percentage-based) from a PlatformFee contract")
  .addParam("contract", "The deployed PlatformFee-compatible contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getPlatformFeeInfo } = await import("../sdk");

    try {
      const result = await getPlatformFeeInfo(args.contract, signer);
      console.log("Platform Fee Info:", result);
    } catch (error) {
      console.error("Error fetching platform fee info:", error);
    }
  });

task("getPlatformFeeType", "Get the platform fee type (flat vs percentage) from a PlatformFee contract")
  .addParam("contract", "The deployed PlatformFee-compatible contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getPlatformFeeType } = await import("../sdk");

    try {
      const result = await getPlatformFeeType(args.contract, signer);
      console.log("Platform Fee Type:", result);
    } catch (error) {
      console.error("Error fetching platform fee type:", error);
    }
  });
