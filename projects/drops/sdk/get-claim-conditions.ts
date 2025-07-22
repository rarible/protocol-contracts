import { Signer } from "ethers";
import { Drop__factory } from "../typechain-types";

/**
 * Gets claim conditions from a known drop contract.
 *
 * @param contractType One of: "drop721", "drop1155", "openedition"
 */
export async function getClaimConditions(
  contractAddress: string,
  signer: Signer
) {
  const contract = Drop__factory.connect(contractAddress, signer);
  const claimConditionsList = await contract.claimCondition();
  let claimConditions = [];
  for (let i = 0; i < claimConditionsList.count.toNumber(); i++) {
    const condition = await contract.getClaimConditionById(i);
    const parsedCondition = {
      startTimestamp: condition.startTimestamp.toNumber(),
      maxClaimableSupply: condition.maxClaimableSupply,
      supplyClaimed: condition.supplyClaimed,
      quantityLimitPerWallet: condition.quantityLimitPerWallet,
      merkleRoot: condition.merkleRoot,
      pricePerToken: condition.pricePerToken,
      currency: condition.currency,
      metadata: condition.metadata,
    };
    claimConditions.push(parsedCondition);
  }

  return claimConditions;
}
