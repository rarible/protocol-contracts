// <ai_context>
// tasks/mintNftTask.ts
// Hardhat task that calls the SDK's "owner" function
// Updated to pass a selected signer
// </ai_context>

import { task } from "hardhat/config";

task("owner", "Check the owner of a contract")
  .addParam("collectionAddress", "The address of the NFT collection")
  .addOptionalParam("signerIndex", "Index of the signer to use (default 0)", "0")
  .addOptionalParam("gasLimit", "Gas limit (default 1000000)", "1000000")
  .setAction(async (args, hre) => {
    const { collectionAddress, signerIndex, gasLimit } = args;
    const { owner } = await import("../sdk");

    const signers = await hre.ethers.getSigners();
    const index = parseInt(signerIndex);
    if (!signers[index]) {
      throw new Error(`No signer found at index ${index}`);
    }

    const chosenSigner = signers[index];
    const contractOwner = await owner(chosenSigner, {
      collectionAddress,
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => owner:", contractOwner);
  });