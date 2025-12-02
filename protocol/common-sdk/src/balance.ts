// <ai_context> TypeScript port of scripts/balance.js. Provides helper function to verify ETH balance changes during transactions, accounting for gas costs when the sender is the tracked account. </ai_context>

import type { ContractTransactionResponse, Signer } from "ethers";

/**
 * Verifies that an account's ETH balance changes by the expected amount during a transaction.
 * Accounts for gas costs if the transaction sender is the same as the tracked account.
 *
 * @param provider - Ethers provider to query balances
 * @param account - The account address to track balance for
 * @param expectedChange - The expected balance change (positive = balance decreased, negative = balance increased)
 * @param todo - Async function that performs the transaction and returns the transaction response
 * @returns The transaction response from the todo function
 */
export async function verifyBalanceChangeReturnTx<T extends ContractTransactionResponse>(
  provider: Signer["provider"],
  account: string,
  expectedChange: bigint | number | string,
  todo: () => Promise<T>,
): Promise<T> {
  if (!provider) {
    throw new Error("Provider is required");
  }

  const change = BigInt(expectedChange);
  const normalizedAccount = account.toLowerCase();

  const before = await provider.getBalance(account);
  const tx = await todo();
  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error("Transaction receipt not found");
  }

  const after = await provider.getBalance(account);
  let actual = before - after;

  // If the transaction sender is the tracked account, subtract gas costs
  const txSender = receipt.from.toLowerCase();
  if (txSender === normalizedAccount) {
    const gasUsed = receipt.gasUsed;
    const effectiveGasPrice = receipt.gasPrice;
    const moneyUsedForGas = gasUsed * effectiveGasPrice;
    actual = actual - moneyUsedForGas;
  }

  if (actual !== change) {
    throw new Error(`Balance change mismatch: expected ${change}, got ${actual}`);
  }

  return tx;
}
