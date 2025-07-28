import { Signer, BigNumber } from "ethers";
import { Drop__factory } from "../typechain-types";

export type ClaimCondition = {
  startTimestamp: number;
  maxClaimableSupply: number | BigNumber;
  supplyClaimed: number | BigNumber;
  quantityLimitPerWallet: number | BigNumber;
  merkleRoot: string;
  pricePerToken: string | BigNumber;
  currency: string;
  metadata: string;
};

/**
 * Sets claim conditions on a known drop contract.
 *
 * @param contractType One of: "drop721", "drop1155", "openedition"
 */
export async function setClaimConditions(
  contractAddress: string,
  conditions: ClaimCondition[],
  reset: boolean,
  signer: Signer
) {
  const contract = Drop__factory.connect(contractAddress, signer);
  const tx = await contract.setClaimConditions(conditions, reset);

  console.log(`Setting claim conditions... tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log("✅ Claim conditions set.");
  return receipt;
}
