// <ai_context>
// tasks/mintNftTask.ts
// Hardhat task that calls the SDK's supportInterface function
// Updated to pass a selected signer
// </ai_context>

import { task } from "hardhat/config";

task("supportInterface", "Check if an interface is supported by a contract")
  .addParam("collectionAddress", "The address of the NFT collection")
  .addParam("interfaceId", "The interface ID to check")
  .addOptionalParam("signerIndex", "Index of the signer to use (default 0)", "0")
  .addOptionalParam("gasLimit", "Gas limit (default 1000000)", "1000000")
  .setAction(async (args, hre) => {
    const { collectionAddress, interfaceId, signerIndex, gasLimit } = args;

    const { supportInterface } = await import("../sdk");

    const signers = await hre.ethers.getSigners();
    const index = parseInt(signerIndex);
    if (!signers[index]) {
      throw new Error(`No signer found at index ${index}`);
    }
    const chosenSigner = signers[index];

    const isSupported = await supportInterface(chosenSigner, {
      collectionAddress,
      interfaceId,
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => is interface supported:", isSupported);
  });