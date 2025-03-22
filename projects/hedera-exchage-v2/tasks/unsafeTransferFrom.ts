// <ai_context>
// tasks/unsafeTransferFrom.ts
// Hardhat task to execute an unsafe transfer of an NFT, bypassing safeTransfer checks
// Updated to pass the signer from tasks to the SDK
// </ai_context>

import { task } from "hardhat/config";

task("unsafeTransferFrom", "Transfer NFT without safeTransfer checks")
  .addParam("token", "NFT collection address")
  .addParam("to", "Recipient address")
  .addParam("tokenId", "Token ID to transfer")
  .addParam("transferProxy", "Transfer proxy address")
  .addOptionalParam("from", "From address (defaults to signer)")
  .addOptionalParam("signerIndex", "Signer index", "0")
  .addOptionalParam("gasLimit", "Gas limit (default 4000000)", "4000000")
  .setAction(async (args, hre) => {
    const { transferFrom: unsafeTransferFromProxy } = await import("../sdk/unsafeTransferProxy");
    const { token, to, tokenId, from, signerIndex, transferProxy, gasLimit } = args;
    const signers = await hre.ethers.getSigners();
    const signer = signers[Number(signerIndex)];

    console.log(`Unsafe transfer: Transferring token ${tokenId} from collection ${token} to ${to}...`);
    const fromAddress = from || (await signer.getAddress());

    const receipt = await unsafeTransferFromProxy(
      signer,
      transferProxy,
      fromAddress,
      to,
      token,
      tokenId,
      Number(gasLimit)
    );

    console.log("Transfer transaction hash:", receipt.transactionHash);
    console.log("Transfer successful!");
  });