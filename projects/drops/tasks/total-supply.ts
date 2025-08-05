import { task } from "hardhat/config";

task("totalSupply", "Get the total supply of a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721", "1155", or "oe"')
  .addOptionalParam("tokenid", "Token ID (required for 1155 contract type)")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { totalSupply } = await import("../sdk");

    if (args.type === "1155" && args.tokenid === undefined) {
      throw new Error("Token ID is required for ERC1155 contracts");
    }

    try {
      const tokenId = args.tokenid ? parseInt(args.tokenid) : 0;

      const supply = await totalSupply(args.contract, args.type, tokenId, signer);

      console.log(
        args.type === "1155"
          ? `Total supply of token ID ${tokenId}: ${supply.toString()}`
          : `Total supply: ${supply.toString()}`
      );
    } catch (error) {
      console.error("Error fetching total supply:", error);
    }
  });
