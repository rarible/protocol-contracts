// <ai_context>
// tasks/transferNftTask.ts
// Hardhat task that uses the transferNft function from our sdk
// </ai_context>

import { task } from "hardhat/config";


task("transferNft", "Transfer a Hedera NFT (with optional association) using the sdk")
  .addParam("tokenAddress", "NFT contract address to transfer")
  .addParam("to", "Recipient address")
  .addParam("tokenId", "Token ID to transfer")
  .addOptionalParam("doAssociate", "Whether to associate (default true)", "true")
  .addOptionalParam("gasLimit", "Gas limit (default 6000000)", "6000000")
  .setAction(async (args, hre) => {
    const { tokenAddress, to, tokenId, doAssociate, gasLimit } = args;
    const { transferNft } = await import("../sdk");
    const txHash = await transferNft({
      tokenAddress,
      to,
      tokenId,
      doAssociate: (doAssociate === "true"),
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => transferred NFT, tx hash:", txHash);
  });