// <ai_context>
// tasks/verify721Task.ts
// Hardhat task that uses the verify721 function from our sdk
// </ai_context>

import { task } from "hardhat/config";

task("verify721", "Verify an ERC721 contract using the sdk")
  .addParam("collectionAddress", "The NFT collection address to verify")
  .addParam("tokenId", "Token ID to test, e.g. 1")
  .addOptionalParam("to", "An address to test transfer", undefined)
  .addOptionalParam("operator", "An address to test setApprovalForAll", undefined)
  .addOptionalParam("gasLimit", "Gas limit (default 4000000)", "4000000")
  .setAction(async (args, hre) => {
    const { collectionAddress, tokenId, to, operator, gasLimit } = args;

    const { verify721 } = await import("../sdk");
    await verify721({
      collectionAddress,
      tokenId,
      to,
      operator,
      gasLimit: parseInt(gasLimit),
    });
    console.log("SDK => verify completed");
  });