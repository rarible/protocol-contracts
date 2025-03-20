// <ai_context>
// tasks/associateToken.ts
// Hardhat task that uses the SDK function to associate a Hedera token with a designated signer
// </ai_context>

import { task } from "hardhat/config";

task("associateToken", "Associates a Hedera token with a designated signer so it can receive tokens")
  .addParam("tokenAddress", "The token address to associate")
  .addOptionalParam("gasLimit", "Gas limit for the association (default 1000000)", "1000000")
  .addOptionalParam("signerIndex", "Index of the signer to use (default 1)", "1")
  .setAction(async (args, hre) => {
    const { tokenAddress, gasLimit, signerIndex } = args;
    const { associateToken } = await import("../sdk");
    await associateToken({
      tokenAddress,
      gasLimit: parseInt(gasLimit),
      signerIndex: parseInt(signerIndex),
    });
    console.log("SDK => Token association completed");
  });