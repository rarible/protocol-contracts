import { Contract, Signer } from "ethers";

// Minimal ABI to interact with Ownable contracts
const ownableAbi = [
  "function transferOwnership(address newOwner) external",
];

/**
 * Transfers ownership of a contract that uses OpenZeppelin Ownable.
 *
 * @param contractAddress The address of the Ownable contract
 * @param newOwner The address to transfer ownership to
 * @param signer A signer that is the current owner
 */
export async function transferOwnershipOfContract(
  contractAddress: string,
  newOwner: string,
  signer: Signer
): Promise<void> {
  const contract = new Contract(contractAddress, ownableAbi, signer);
  const tx = await contract.transferOwnership(newOwner);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Ownership transferred to ${newOwner}`);
}
