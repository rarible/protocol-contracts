import { task } from "hardhat/config";

task("is-approved-for-all", "Check if an operator is approved for all tokens from an ERC721AUpgradeable contract")
  .addParam("contract", "The deployed ERC721AUpgradeable contract address")
  .addParam("owner", "The owner of the tokens")
  .addParam("operator", "The operator to check approval for")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { isApprovedForAll } = await import("../sdk");

    try {
      const approved = await isApprovedForAll(args.contract, args.owner, args.operator, signer);
      console.log(`Operator ${args.operator} is ${approved ? "" : "not "}approved for all tokens of owner ${args.owner}`);
    } catch (error) {
      console.error("Error checking approval for all:", error);
    }
  });
