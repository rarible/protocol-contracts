// <ai_context>
// tasks/mintNftTask.ts
// Hardhat task that uses the mintNft function from our sdk
// </ai_context>

import { task } from "hardhat/config";

task("mintNftSdk", "Mint an NFT from a given collection (using the sdk)")
  .addParam("collectionAddress", "The address of the NFT collection")
  .addOptionalParam("gasLimit", "Gas limit (default 4000000)", "4000000")
  .setAction(async (args, hre) => {
    const { collectionAddress, gasLimit } = args;

    const { mintNft } = await import("../sdk");
    const txHash = await mintNft({
      collectionAddress,
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => minted NFT, tx hash:", txHash);
  });