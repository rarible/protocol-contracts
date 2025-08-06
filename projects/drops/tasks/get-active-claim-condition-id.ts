import { task } from "hardhat/config";

task("get-active-claim-condition-id", "Get the active claim condition ID from a Drop contract")
  .addParam("contract", "The deployed Drop contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getActiveClaimConditionId } = await import("../sdk");

    try {
      const id = await getActiveClaimConditionId(args.contract, signer);
      console.log(`Active claim condition ID: ${id.toString()}`);
    } catch (error) {
      console.error("Error fetching active claim condition ID:", error);
    }
  });
