import { task } from "hardhat/config";

task("totalMinted", "Get the total minted amount from a Drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721" or "oe"')
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { totalMinted } = await import("../sdk");

    try {
      const total = await totalMinted(args.contract, args.type, signer);
      console.log(`Total minted tokens: ${total.toString()}`);
    } catch (error) {
      console.error("Error fetching total minted:", error);
    }
  });
