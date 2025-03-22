// <ai_context>
// tasks/verify721Task.ts
// Hardhat task that uses the verify721 function from our sdk
// Updated to pass a signer
// </ai_context>

import { task } from "hardhat/config";

task("verify721", "Verify an ERC721 contract using the sdk")
  .addParam("collectionAddress", "The NFT collection address to verify")
  .addParam("tokenId", "Token ID to test, e.g. 1")
  .addOptionalParam("to", "An address to test transfer", undefined)
  .addOptionalParam("operator", "An address to test setApprovalForAll", undefined)
  .addOptionalParam("gasLimit", "Gas limit (default 4000000)", "4000000")
  .addOptionalParam("signerIndex", "Which signer to use (default 0)", "0")
  .setAction(async (args, hre) => {
    const { collectionAddress, tokenId, to, operator, gasLimit, signerIndex } = args;
    const { verify721 } = await import("../sdk");

    const signers = await hre.ethers.getSigners();
    const index = parseInt(signerIndex);
    if (!signers[index]) {
      throw new Error(`No signer found at index ${index}`);
    }
    const signer = signers[index];

    await verify721(signer, {
      collectionAddress,
      tokenId,
      to,
      operator,
      gasLimit: parseInt(gasLimit),
    });
    console.log("SDK => verify completed");
  });