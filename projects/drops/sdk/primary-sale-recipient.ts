import { Signer } from "ethers";
import { PrimarySale__factory } from "../typechain-types";

/**
 * Gets the primary sale recipient from a known drop contract.
 *
 * @param contractAddress The address of the Drop contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function primarySaleRecipient(
  contractAddress: string,
  signer: Signer
) {
    const drop = PrimarySale__factory.connect(contractAddress, signer);

    return await drop.primarySaleRecipient();
}