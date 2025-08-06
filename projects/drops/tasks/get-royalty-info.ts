import { task } from "hardhat/config";

task("get-default-royalty-info", "Get the default royalty info from a Royalty contract")
  .addParam("contract", "The deployed contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getDefaultRoyaltyInfo } = await import("../sdk");

    try {
      const info = await getDefaultRoyaltyInfo(args.contract, signer);
      console.log("Default Royalty Info:", info);
    } catch (error) {
      console.error("Error fetching default royalty info:", error);
    }
  });

task("get-royalty-info-for-token", "Get royalty info for a specific token from a Royalty contract")
  .addParam("contract", "The deployed contract address")
  .addParam("tokenid", "Token ID to query")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getRoyaltyInfoForToken } = await import("../sdk");

    try {
      const info = await getRoyaltyInfoForToken(args.contract, parseInt(args.tokenid), signer);
      console.log(`Royalty Info for token ${args.tokenid}:`, info);
    } catch (error) {
      console.error("Error fetching royalty info for token:", error);
    }
  });

task("get-royalty-info", "Get royalty info for a token and sale price from a Royalty contract")
  .addParam("contract", "The deployed contract address")
  .addParam("tokenid", "Token ID to query")
  .addParam("saleprice", "Sale price (in wei)")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getRoyaltyInfo } = await import("../sdk");

    try {
      const info = await getRoyaltyInfo(args.contract, parseInt(args.tokenid), parseInt(args.saleprice), signer);
      console.log(`Royalty Info for token ${args.tokenid} with sale price ${args.saleprice}:`, info);
    } catch (error) {
      console.error("Error fetching royalty info:", error);
    }
  });
