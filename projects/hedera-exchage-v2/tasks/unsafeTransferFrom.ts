// <ai_context>
// tasks/unsafeTransferFrom.ts
// Hardhat task to execute an unsafe transfer of an NFT, bypassing safeTransfer checks
// </ai_context>

import { task } from "hardhat/config";

task("unsafeTransferFrom", "Transfer NFT without safeTransfer checks")
  .addParam("token", "NFT collection address")
  .addParam("to", "Recipient address")
  .addParam("tokenId", "Token ID to transfer")
  .addOptionalParam("from", "From address (defaults to signer)")
  .addOptionalParam("signerIndex", "Signer index", "0")
  .setAction(async (args, hre) => {
    const { transferFrom } = await import("../sdk/unsafeTransferProxy");
    const { token, to, tokenId, from, signerIndex } = args;
    const signers = await hre.ethers.getSigners();
    const signer = signers[Number(signerIndex)];
    
    console.log(`Unsafe transfer: Transferring token ${tokenId} from collection ${token} to ${to}...`);
    const fromAddress = from || await signer.getAddress();
    
    const tx = await transferFrom(
      token,
      fromAddress,
      to,
      tokenId,
      signer
    );
    
    console.log("Transfer transaction hash:", tx.transactionHash);
    console.log("Transfer successful!");
  });