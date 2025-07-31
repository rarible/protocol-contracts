import { Signer } from "ethers";
import { PrimarySale__factory } from "../typechain-types";

/**
 * Sets PrimarySale recipient of a contract that uses PrimarySale external contract.
 *
 * @param contractAddress The address of the PrimarySale contract
 * @param recipient The address of the primary sale recipient
 * @param signer A signer that is the current owner
 */
export async function setPrimarySaleRecipient(
  contractAddress: string,
  recipient: string,
  signer: Signer
): Promise<void> {
  const contract = PrimarySale__factory.connect(contractAddress, signer);
  const tx = await contract.setPrimarySaleRecipient(recipient);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Primary sales recipient set as ${recipient}`);
}