import { task } from "hardhat/config";

task("getSupplyClaimedByWallet", "Get the supply claimed by a wallet for a claim condition in a Drop contract")
  .addParam("contract", "The deployed Drop contract address")
  .addParam("conditionid", "The claim condition ID")
  .addParam("claimer", "The address of the claimer")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getSupplyClaimedByWallet } = await import("../sdk");

    try {
      const claimed = await getSupplyClaimedByWallet(
        args.contract,
        parseInt(args.conditionid),
        args.claimer,
        signer
      );
      console.log(`Supply claimed by ${args.claimer} for condition ID ${args.conditionid}: ${claimed.toString()}`);
    } catch (error) {
      console.error("Error fetching supply claimed by wallet:", error);
    }
  });
