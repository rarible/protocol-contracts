import { Contract, Signer } from "ethers";
import { PlatformFee__factory } from "../typechain-types";

export const PlatformFeeType = {
  BPS: 0,
  FLAT: 1
};

export const isValidPlatformFeeType = (platformFeeType: number) => {
  return [PlatformFeeType.BPS, PlatformFeeType.FLAT].includes(platformFeeType);
};

/**
 * Sets Platform Fee Type of a contract that uses Platform Fee external contract.
 *
 * @param contractAddress The address of the Ownable contract
 * @param platformFeeType The platform fee type of the contract
 * @param signer A signer that is the current owner
 */
export async function setPlatformFeeType(
  contractAddress: string,
  platformFeeType: number,
  signer: Signer
): Promise<void> {
  const contract = PlatformFee__factory.connect(contractAddress, signer);
  const isValid = isValidPlatformFeeType(platformFeeType);
  if (!isValid) {
    throw new Error("PlatformFeeType provided is not valid");
  }
  const tx = await contract.setPlatformFeeType(platformFeeType);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
}
