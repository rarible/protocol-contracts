// <ai_context>
// tasks/mintNftTask.ts
// Hardhat task that uses the mintNft function from our sdk
// </ai_context>

import { task } from "hardhat/config";

task("owner", "Check the owner of a contract")
  .addParam("collectionAddress", "The address of the NFT collection")
  .setAction(async (args, hre) => {
    const { collectionAddress } = args;

    const { owner } = await import("../sdk");   
    const ownerAddress = await owner({
      collectionAddress,
    });

    console.log("SDK => owner:", ownerAddress);
});