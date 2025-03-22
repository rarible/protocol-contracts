// <ai_context>
// tasks/associateToken.ts
// Hardhat task that uses the SDK function to associate a Hedera token with a designated signer
// Updated to pass the signer to the new associateToken function
// </ai_context>

import { task } from "hardhat/config";

task("associateToken", "Associates a Hedera token with a designated signer so it can receive tokens")
  .addParam("tokenAddress", "The token address to associate")
  .addOptionalParam("gasLimit", "Gas limit for the association (default 1000000)", "1000000")
  .addOptionalParam("signerIndex", "Index of the signer to use (default 1)", "1")
  .setAction(async (args, hre) => {
    const { tokenAddress, gasLimit, signerIndex } = args;
    const { associateToken } = await import("../sdk");

    const signers = await hre.ethers.getSigners();
    const index = parseInt(signerIndex);
    if (!signers[index]) {
      throw new Error(`No signer found at index ${index}`);
    }
    const designatedSigner = signers[index];

    const txHash = await associateToken(designatedSigner, {
      tokenAddress,
      gasLimit: parseInt(gasLimit)
    });
    console.log("SDK => Token association completed, tx hash:", txHash);
  });