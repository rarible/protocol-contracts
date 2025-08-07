import { task } from "hardhat/config";

task("symbol", "Get the symbol of a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721", "1155", or "oe"')
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { symbol } = await import("../sdk");

    try {
      const contractSymbol = await symbol(args.contract, args.type, signer);
      console.log(`Contract symbol: ${contractSymbol}`);
    } catch (error) {
      console.error("Error fetching contract symbol:", error);
    }
  });
