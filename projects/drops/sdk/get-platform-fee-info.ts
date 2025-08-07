import { Signer } from "ethers";
import { PlatformFee__factory } from "../typechain-types";

/**
 * Gets the flat platform fee information from a contract implementing the PlatformFee interface.
 *
 * @param contractAddress The address of the contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getFlatPlatformFeeInfo(
  contractAddress: string,
  signer: Signer
) {
    const drop = PlatformFee__factory.connect(contractAddress, signer);

    return await drop.getFlatPlatformFeeInfo();
}

/**
 * Gets the platform fee information from a contract implementing the PlatformFee interface.
 *
 * @param contractAddress The address of the contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getPlatformFeeInfo(
  contractAddress: string,
  signer: Signer
) {
    const drop = PlatformFee__factory.connect(contractAddress, signer);

    return await drop.getPlatformFeeInfo();
}

/**
 * Gets the platform fee type from a contract implementing the PlatformFee interface.
 *
 * @param contractAddress The address of the contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getPlatformFeeType(
  contractAddress: string,
  signer: Signer
) {
    const drop = PlatformFee__factory.connect(contractAddress, signer);

    return await drop.getPlatformFeeType();
}