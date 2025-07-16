import { Contract, Signer } from "ethers";
import { Ownable__factory } from "../typechain-types";

/**
 * Transfers ownership of a contract that uses OpenZeppelin Ownable.
 *
 * @param contractAddress The address of the Ownable contract
 * @param newOwner The address to transfer ownership to
 * @param signer A signer that is the current owner
 */
export async function transferOwnership(
  contractAddress: string,
  newOwner: string,
  signer: Signer
): Promise<void> {
  const contract = Ownable__factory.connect(contractAddress, signer);
  const tx = await contract.setOwner(newOwner);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Ownership transferred to ${newOwner}`);
}
