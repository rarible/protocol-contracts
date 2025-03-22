// <ai_context>
// tasks/associateToken.ts
// Hardhat task that calls the SDK's approveForAll function
// Updated to pass a selected signer
// </ai_context>

import { task } from "hardhat/config";

task("approveForAll", "Approve a contract to manage all tokens")
  .addParam("tokenAddress", "The token address to approve")
  .addParam("operator", "The operator to approve")
  .addOptionalParam("signerIndex", "Index of the signer to use (default 0)", "0")
  .addOptionalParam("gasLimit", "Gas limit (default 1000000)", "1000000")
  .setAction(async (args, hre) => {
    const { tokenAddress, operator, signerIndex, gasLimit } = args;
    const { approveForAll } = await import("../sdk");

    const signers = await hre.ethers.getSigners();
    const index = parseInt(signerIndex);
    if (!signers[index]) {
      throw new Error(`No signer at index=${index}`);
    }
    const chosenSigner = signers[index];

    const txHash = await approveForAll(chosenSigner, {
      tokenAddress,
      operator,
      gasLimit: parseInt(gasLimit),
    });
    console.log("SDK => Token approval completed, tx hash:", txHash);
  });