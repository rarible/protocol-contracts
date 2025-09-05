import { Contract, Signer } from "ethers";
import { PlatformFee__factory } from "../typechain-types";

/**
 * Sets Platform Fee of a contract that uses Platform Fee external contract.
 *
 * @param contractAddress The address of the Ownable contract
 * @param platformFeeRecipient The address to transfer ownership to
 * @param platformFeeBps The bps of the platform fee
 * @param signer A signer that is the current owner
 */
export async function setPlatformFeeInfo(
  contractAddress: string,
  platformFeeRecipient: string,
  platformFeeBps: number,
  signer: Signer
): Promise<void> {
  const contract = PlatformFee__factory.connect(contractAddress, signer);
  // Correct BPS setter
  const tx = await contract.setPlatformFeeInfo(platformFeeRecipient, platformFeeBps);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Platform fee (BPS) set for ${platformFeeRecipient} to ${platformFeeBps}`);
}

/**
 * Sets Flat Platform Fee of a contract that uses Platform Fee external contract.
 *
 * @param contractAddress The address of the Ownable contract
 * @param platformFeeRecipient The address to transfer ownership to
 * @param platformFee The amount of the platform fee
 * @param signer A signer that is the current owner
 */
export async function setFlatPlatformFeeInfo(
    contractAddress: string,
    platformFeeRecipient: string,
    platformFee: number,
    signer: Signer
  ): Promise<void> {
    const contract = PlatformFee__factory.connect(contractAddress, signer);
    const tx = await contract.setFlatPlatformFeeInfo(platformFeeRecipient, platformFee);
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Flat Platform fee set for ${platformFeeRecipient} of ${platformFee}`);
  }