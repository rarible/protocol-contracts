import { Contract, Signer } from "ethers";
import { Ownable__factory } from "../typechain-types";

/**
 * Transfers ownership of a contract that uses OpenZeppelin Ownable.
 *
 * @param contractAddress The address of the Ownable contract
 * @param newOwner The address to transfer ownership to
 * @param signer A signer that is the current owner
 */
export async function owner(
  contractAddress: string,
  signer: Signer
): Promise<string> {
  const contract = Ownable__factory.connect(contractAddress, signer);
  const owner = await contract.owner();
  return owner.toString();
}
