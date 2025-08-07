import { Signer } from "ethers";
import { Drop__factory } from "../typechain-types";

/**
 * Gets claim conditions from a known drop contract.
 *
 * @param contractType One of: "drop721", "drop1155", "openedition"
 */
export async function getClaimConditionById(
  contractAddress: string,
  conditionId: number,
  signer: Signer
) {
    const drop = Drop__factory.connect(contractAddress, signer);

    return await drop.getClaimConditionById(conditionId);
}