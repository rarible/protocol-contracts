// <ai_context>
// tasks/unsafeTransferFrom.ts
// Hardhat task to execute an unsafe transfer of an NFT, bypassing safeTransfer checks
// </ai_context>

import { task } from "hardhat/config";

task("addOperator", "Add operator role to transfer proxy")
  .addParam("transferProxy", "Transfer proxy address")
  .addParam("to", "Recipient address")
  .addOptionalParam("signerIndex", "Signer index", "0")
  .setAction(async (args, hre) => {
    const { addOperatorRole } = await import("../sdk/unsafeTransferProxy");
    const { transferProxy, to, signerIndex } = args;
    const signers = await hre.ethers.getSigners();
    const signer = signers[Number(signerIndex)];
    
    console.log(`Adding operator role to transfer proxy ${transferProxy} for ${to}...`);
    
    const tx = await addOperatorRole(
      transferProxy,
      to,
    );
    
    console.log("Add operator transaction hash:", tx.hash);
    console.log("Add operator successful!");
  });