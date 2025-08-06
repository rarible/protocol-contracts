import { task } from "hardhat/config";

task("contract-uri", "Get the contract URI from a drop contract")
  .addParam("contract", "The deployed drop contract address")
  .addParam("type", "Contract type: 721, 1155, or oe")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];
    const { contractURI } = await import("../sdk");

    const contractType = args.type as "721" | "1155" | "oe";

    try {
      const uri = await contractURI(args.contract, contractType, signer);
      console.log(`Contract URI: ${uri}`);
    } catch (error) {
      console.error("Error fetching contract URI:", error);
    }
  });
