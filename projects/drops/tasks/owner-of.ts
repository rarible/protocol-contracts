import { task } from "hardhat/config";

task("owner-of", "Get the owner of a token from a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721" or "oe" (OpenEdition)')
  .addParam("tokenid", "Token ID to query")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { ownerOf } = await import("../sdk");

    try {
      const owner = await ownerOf(args.contract, args.type, parseInt(args.tokenid), signer);
      console.log(`Owner of token ${args.tokenid}: ${owner}`);
    } catch (error) {
      console.error("Error fetching token owner:", error);
    }
  });
