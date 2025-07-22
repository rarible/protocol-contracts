import { task } from "hardhat/config";

task("remove-phase", "Removes a phase from a drop contract")
  .addParam("contract", "Deployed contract address")
  .addParam("phaseIndex", "Index of the phase to remove")
  .addOptionalParam("from", "Signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { getClaimConditions } = await import("../sdk/get-claim-conditions");
    const { setClaimConditions } = await import("../sdk/set-claim-conditions");
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];
    
    const claimConditions = await getClaimConditions(args.contract, signer);
    const newClaimConditions = claimConditions.filter((_, index) => index !== parseInt(args.phaseIndex));
    await setClaimConditions(args.contract, newClaimConditions, false, signer);
    console.log(`✅ Claim condition for phase "${args.phaseIndex}" successfully removed.`);
  });
