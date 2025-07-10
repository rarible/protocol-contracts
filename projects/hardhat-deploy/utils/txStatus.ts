// txStatus.ts
import { ethers } from "ethers";

/** High-level classification of a transaction’s state. */
export type TxStatus = "success" | "fail" | "pending" | "notFound";

/**
 * Query the current status of a transaction.
 *
 * @param txHash   0x-prefixed 32-byte transaction hash
 * @param provider Any ethers-v5 provider (JsonRpcProvider, InfuraProvider, AlchemyProvider, etc.)
 * @returns        One of "success" | "fail" | "pending" | "notFound"
 */
export async function getTransactionStatus(
  txHash: string,
  provider: ethers.providers.Provider
): Promise<TxStatus> {
  // Basic sanity check
  if (!ethers.utils.isHexString(txHash) || txHash.length !== 66) {
    throw new Error("Invalid transaction hash");
  }

  // Try to fetch the receipt; undefined => not yet mined
  const receipt = await provider.getTransactionReceipt(txHash);
  if (receipt) {
    // Byzantium-and-later blocks include a status field (0 = fail, 1 = success)
    return receipt.status === 1 ? "success" : "fail";
  }

  // No receipt – could still be pending or be an invalid hash
  const tx = await provider.getTransaction(txHash);
  return tx ? "pending" : "notFound";
}

/**
 * Wait until the transaction is mined (and optionally confirmed) and
 * return its final success / fail status.
 *
 * @param txHash         Transaction hash
 * @param provider       ethers provider
 * @param confirmations  # of block confirmations to wait for (default 1)
 */
export async function waitForStatus(
  txHash: string,
  provider: ethers.providers.Provider,
  confirmations = 1
): Promise<Exclude<TxStatus, "pending" | "notFound">> {
  const receipt = await provider.waitForTransaction(txHash, confirmations);
  return receipt.status === 1 ? "success" : "fail";
}
