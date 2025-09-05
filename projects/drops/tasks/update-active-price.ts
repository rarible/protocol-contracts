/*
<ai_context>
This task updates the price for the active claim condition in a Drop contract.
It reads current conditions, updates only the price, and sets back without reset.
</ai_context>
*/
import { task } from "hardhat/config";
import { BigNumber } from "ethers";
task("update-active-price", "Updates the price for the active claim condition in a Drop contract")
  .addParam("contract", "The deployed Drop contract address")
  .addParam("price", "The new price per token (as string)")
  .addOptionalParam("from", "Signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];
    const { getClaimConditions, setClaimConditions, getActiveClaimConditionId } = await import("../sdk");
    // Read current conditions
    const conditions = await getClaimConditions(args.contract, signer);
    if (conditions.length === 0) {
      throw new Error("No claim conditions exist");
    }
    // Get active ID
    const activeId = await getActiveClaimConditionId(args.contract, signer);
    const activeIndex = activeId.toNumber();
    if (activeIndex >= conditions.length) {
      throw new Error("Active claim condition not found");
    }
    // Update price for active
    const updatedConditions = [...conditions];
    updatedConditions[activeIndex] = {
      ...updatedConditions[activeIndex],
      pricePerToken: BigNumber.from(args.price),
    };
    // Set back without reset
    await setClaimConditions(args.contract, updatedConditions, false, signer);
    console.log(`✅ Price updated to ${args.price} for active claim condition (ID: ${activeId.toString()})`);
  });