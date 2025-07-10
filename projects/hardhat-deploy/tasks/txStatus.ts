import { task } from "hardhat/config";
import { getTransactionStatus, waitForStatus } from "../utils/txStatus"; // adjust the path if necessary

task("tx-status", "Check or wait for an EVM transaction’s status")
  .addParam("hash", "0x-prefixed transaction hash")
  .addOptionalParam(
    "wait",
    "Block confirmations to wait for (0 = just show current status)",
    "0"
  )
  .setAction(async ({ hash, wait }, hre) => {
    const confirmations = parseInt(wait, 10);
    const provider = hre.ethers.provider;

    if (confirmations > 0) {
      console.log(`⏳ Waiting for ${confirmations} confirmation(s)…`);
      const finalStatus = await waitForStatus(hash, provider, confirmations);
      console.log(`✅ Final status after ${confirmations} confirmations: ${finalStatus}`);
    } else {
      const snapshot = await getTransactionStatus(hash, provider);
      console.log(`📋 Current status: ${snapshot}`);
    }
  });
