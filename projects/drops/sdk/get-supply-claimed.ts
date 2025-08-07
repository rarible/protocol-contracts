import { Signer } from "ethers";
import { Drop__factory } from "../typechain-types";

/**
 * Gets the supply claimed by a wallet from a Drop contract.
 *
 * @param contractAddress The address of the Drop contract.
 * @param conditionId The ID of the claim condition.
 * @param claimer The address of the claimer.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getSupplyClaimedByWallet(
  contractAddress: string,
  conditionId: number,
  claimer: string,
  signer: Signer
) {
    const drop = Drop__factory.connect(contractAddress, signer);

    return await drop.getSupplyClaimedByWallet(conditionId, claimer);
}