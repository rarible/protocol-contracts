import { task } from "hardhat/config";

task("explicit-ownership-of", "Get ownership details of a token from an ERC721AQueryableUpgradeable contract")
  .addParam("contract", "The deployed contract address (must be ERC721AQueryableUpgradeable)")
  .addParam("tokenid", "Token ID to query ownership for")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];
    const { explicitOwnershipOf } = await import("../sdk");

    try {
      const ownership = await explicitOwnershipOf(
        args.contract,
        parseInt(args.tokenid),
        signer
      );

      console.log(`Ownership details for token ${args.tokenid}:`);
      console.log(ownership);
    } catch (error) {
      console.error("Error fetching ownership:", error);
    }
  });
