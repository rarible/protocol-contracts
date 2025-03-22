// <ai_context>
// tasks/transferNftTask.ts
// Hardhat task that uses the transferNft function from our sdk
// Updated to accept two signers if doAssociate is true
// </ai_context>

import { task } from "hardhat/config";

task("transferNft", "Transfer a Hedera NFT (with optional association) using the sdk")
  .addParam("tokenAddress", "NFT contract address to transfer")
  .addParam("to", "Recipient address")
  .addParam("tokenId", "Token ID to transfer")
  .addOptionalParam("doAssociate", "Whether to associate (default true)", "true")
  .addOptionalParam("gasLimit", "Gas limit (default 6000000)", "6000000")
  .addOptionalParam("fromSignerIndex", "Index of the from-signer, default=0", "0")
  .addOptionalParam("toSignerIndex", "Index of the to-signer (if doAssociate), default=1", "1")
  .setAction(async (args, hre) => {
    const {
      tokenAddress,
      to,
      tokenId,
      doAssociate,
      gasLimit,
      fromSignerIndex,
      toSignerIndex,
    } = args;

    const { transferNft } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const fromSigIndex = parseInt(fromSignerIndex);
    if (!signers[fromSigIndex]) {
      throw new Error(`No signer found at fromSignerIndex ${fromSigIndex}`);
    }
    const fromSigner = signers[fromSigIndex];

    let toSigner;
    if (doAssociate === "true") {
      const toSigIndex = parseInt(toSignerIndex);
      if (!signers[toSigIndex]) {
        throw new Error(`No signer found at toSignerIndex ${toSigIndex}`);
      }
      toSigner = signers[toSigIndex];
    }

    const txHash = await transferNft(fromSigner, toSigner, {
      tokenAddress,
      to,
      tokenId,
      doAssociate: doAssociate === "true",
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => transferred NFT, tx hash:", txHash);
  });