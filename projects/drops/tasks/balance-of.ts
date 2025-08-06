import { task } from "hardhat/config";

task("balance-of", "Get the token balance for a given address from a drop contract")
  .addParam("contract", "The deployed drop contract address")
  .addParam("type", "Contract type: 721, 1155, or oe")
  .addParam("address", "The address to check the token balance for")
  .addOptionalParam("tokenid", "Token ID (required for ERC1155 contracts)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];
    const { balanceOf } = await import("../sdk");

    const contractType = args.type as "721" | "1155" | "oe";

    if (contractType === "1155" && args.tokenid === undefined) {
      throw new Error("Token ID is required for ERC1155 contracts");
    }

    const tokenId = args.tokenid ? parseInt(args.tokenid) : 0;

    try {
      const balance = await balanceOf(
        args.contract,
        contractType,
        args.address,
        tokenId,
        signer
      );

      console.log(`Balance of ${args.address} is: ${balance.toString()}`);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  });
