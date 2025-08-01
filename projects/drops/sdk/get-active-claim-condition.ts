import { Signer } from "ethers";
import { Drop__factory } from "../typechain-types";

/**
 * Gets claim conditions from a known drop contract.
 *
 * @param contractType One of: "drop721", "drop1155", "openedition"
 */
export async function getActiveClaimCondition(
  contractAddress: string,
  signer: Signer
) {
  const contract = Drop__factory.connect(contractAddress, signer);
  const claimConditionId = await contract.getActiveClaimConditionId();
  const claimCondition = await contract.getClaimConditionById(claimConditionId);

  return claimCondition;
}
