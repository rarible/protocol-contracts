import { task } from "hardhat/config";

// Usage:
// npx hardhat update-batch-base-uri --contract <address> --batch <index> --uri <uri> --network <network>
task("update-batch-base-uri", "Update the base URI for a batch in DropERC721")
  .addParam("contract", "The DropERC721 contract address")
  .addParam("batch", "The batch index")
  .addParam("uri", "The new base URI for the batch")
  .setAction(async (taskArgs, hre) => {
    const { contract, batch, uri } = taskArgs;
    const [signer] = await hre.ethers.getSigners();
    const { updateBatchBaseURI } = await import("../sdk");
    const receipt = await updateBatchBaseURI(contract, Number(batch), uri, signer);
    console.log("Transaction hash:", receipt.transactionHash);
  });
