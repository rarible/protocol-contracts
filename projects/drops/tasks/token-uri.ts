import { task } from "hardhat/config";

task("tokenURI", "Get the token URI for a given token ID from a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721" or "oe"')
  .addParam("tokenid", "Token ID to query")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { tokenURI } = await import("../sdk");

    try {
      const uri = await tokenURI(args.contract, args.type, parseInt(args.tokenid), signer);
      console.log(`Token URI for token ${args.tokenid}: ${uri}`);
    } catch (error) {
      console.error("Error fetching token URI:", error);
    }
  });
