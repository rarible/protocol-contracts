// <ai_context>
// tasks/cancelOrder.ts
// Hardhat task to cancel an existing order using the hederaExchange SDK
// </ai_context>

import { task } from "hardhat/config";

task("cancelOrder", "Cancel an existing order")
  .addParam("exchange", "Exchange contract address")
  .addParam("order", "Order JSON string")
  .addOptionalParam("signerIndex", "Signer index", "0")
  .setAction(async (args, hre) => {
    const { cancelOrder } = await import("../sdk/hederaExchange");
    const { exchange, order, signerIndex } = args;
    const signers = await hre.ethers.getSigners();
    const signer = signers[Number(signerIndex)];
    const orderObj = JSON.parse(order);
    console.log("Cancelling order...");
    const tx = await cancelOrder(exchange, signer, orderObj);
    console.log("Cancel transaction hash:", tx.hash);
  });