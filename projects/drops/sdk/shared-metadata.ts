import { Signer } from "ethers";
import { SharedMetadata__factory } from "../typechain-types";

/**
 * Gets the shared metadata from a known drop contract.
 *
 * @param contractAddress The address of the Drop contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function sharedMetadata(
  contractAddress: string,
  signer: Signer
) {
    const drop = SharedMetadata__factory.connect(contractAddress, signer);

    return await drop.sharedMetadata();
}