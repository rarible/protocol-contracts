// <ai_context>
// tasks/mintNftTask.ts
// Hardhat task that uses the mintNft function from our sdk
// Updated to pass a signer & RariNFTCreator address
// </ai_context>

import { task } from "hardhat/config";

task("mintNft", "Mint an NFT from a given collection (using the sdk)")
  .addParam("collectionAddress", "The address of the NFT collection")
  .addOptionalParam("gasLimit", "Gas limit (default 4000000)", "4000000")
  .addOptionalParam("rariNftCreator", "Override RariNFTCreator address if not from deployments", "")
  .setAction(async (args, hre) => {
    const { collectionAddress, gasLimit, rariNftCreator } = args;
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];

    let rariNFTCreatorAddress = rariNftCreator;
    if (!rariNFTCreatorAddress) {
      try {
        const dep = await hre.deployments.get("RariNFTCreator");
        rariNFTCreatorAddress = dep.address;
      } catch (err) {
        throw new Error("No RariNFTCreator deployment found or address provided.");
      }
    }

    const { mintNft } = await import("../sdk");
    const txHash = await mintNft(deployer, rariNFTCreatorAddress, {
      collectionAddress,
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => minted NFT, tx hash:", txHash);
  });