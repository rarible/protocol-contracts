// <ai_context>
// tasks/mintNftTask.ts
// Hardhat task that uses the mintNft function from our sdk
// </ai_context>

import { task } from "hardhat/config";

task("supportInterface", "Check if an interface is supported by a contract")
  .addParam("collectionAddress", "The address of the NFT collection")
  .addParam("interfaceId", "The interface ID to check")
  .setAction(async (args, hre) => {
    const { collectionAddress, interfaceId } = args;

    const { supportInterface } = await import("../sdk");
    const isSupported = await supportInterface({
      collectionAddress,
      interfaceId,
    });

    console.log("SDK => is interface supported:", isSupported);
});