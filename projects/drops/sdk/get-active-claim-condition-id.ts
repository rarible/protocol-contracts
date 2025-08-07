import { Signer } from "ethers";
import { Drop__factory } from "../typechain-types";

/**
 * Gets the active claim condition ID from a Drop contract.
 *
 * @param contractAddress The address of the Drop contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getActiveClaimConditionId(
  contractAddress: string,
  signer: Signer
) {
    const drop = Drop__factory.connect(contractAddress, signer);

    return await drop.getActiveClaimConditionId();
}