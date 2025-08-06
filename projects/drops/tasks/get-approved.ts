import { task } from "hardhat/config";

task("get-approved", "Get the approved address for a given token ID from an ERC721AQueryableUpgradeable contract")
  .addParam("contract", "The deployed contract address (must be ERC721AQueryableUpgradeable)")
  .addParam("tokenid", "Token ID to check approval for")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getApproved } = await import("../sdk");

    try {
      const approved = await getApproved(args.contract, parseInt(args.tokenid), signer);
      console.log(`Approved address for token ${args.tokenid}: ${approved}`);
    } catch (error) {
      console.error("Error fetching approved address:", error);
    }
  });
