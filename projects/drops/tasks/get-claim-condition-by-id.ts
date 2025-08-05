import { task } from "hardhat/config";

task("getClaimConditionById", "Get a specific claim condition by ID from a Drop contract")
  .addParam("contract", "The deployed Drop contract address")
  .addParam("conditionid", "The ID of the claim condition to fetch")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getClaimConditionById } = await import("../sdk");

    try {
      const condition = await getClaimConditionById(
        args.contract,
        parseInt(args.conditionid),
        signer
      );
      console.log(`Claim condition [ID ${args.conditionid}]:`);
      console.log(condition);
    } catch (error) {
      console.error("Error fetching claim condition:", error);
    }
  });
