import { Signer } from "ethers";
import { Royalty__factory } from "../typechain-types";

/**
 * Sets Royalties of a contract that uses Royalties external contract.
 *
 * @param contractAddress The address of the Ownable contract
 * @param royaltyRecipient The address of the royalties recipient
 * @param royaltyBps The bps of the Royalties
 * @param signer A signer that is the current owner
 */
export async function setRoyaltyInfo(
  contractAddress: string,
  royaltyRecipient: string,
  royaltyBps: number,
  signer: Signer
): Promise<void> {
  const contract = Royalty__factory.connect(contractAddress, signer);
  const tx = await contract.setDefaultRoyaltyInfo(royaltyRecipient, royaltyBps);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Royalty set for ${royaltyRecipient} of ${royaltyBps}`);
}