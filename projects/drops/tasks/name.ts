import { task } from "hardhat/config";

task("name", "Get the name of a known drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721", "1155", or "oe"')
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { name } = await import("../sdk");

    try {
      const contractName = await name(args.contract, args.type, signer);
      console.log(`Contract name: ${contractName}`);
    } catch (error) {
      console.error("Error fetching contract name:", error);
    }
  });
