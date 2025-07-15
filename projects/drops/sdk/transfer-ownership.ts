import { Signer } from "ethers";
import { connectWithDropContract } from "../utils/contractLoader";
import { DropContractType } from "../types/drop-types";

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
  signer: Signer,
  contractType?: DropContractType
): Promise<void> {
  const contract = connectWithDropContract(contractAddress, signer, contractType);
  const tx = await contract.setOwner(newOwner);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Ownership transferred to ${newOwner}`);
}
