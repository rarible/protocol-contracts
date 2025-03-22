// <ai_context>
// tasks/associateToken.ts
// Hardhat task that uses the SDK function to associate a Hedera token with a designated signer
// </ai_context>

import { task } from "hardhat/config";

task("approveForAll", "Approve a contract to manage all tokens")
  .addParam("tokenAddress", "The token address to approve")
  .addParam("operator", "The operator to approve")
  .setAction(async (args, hre) => {
    const { tokenAddress, operator } = args;
    const { approveForAll } = await import("../sdk");
    await approveForAll({
      tokenAddress,
      operator,
    });
    console.log("SDK => Token approval completed");
  });