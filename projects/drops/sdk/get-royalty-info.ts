import { Signer } from "ethers";
import { Royalty__factory } from "../typechain-types";

/**
 * Gets the default royalty information from a contract implementing the Royalty interface.
 *
 * @param contractAddress The address of the contract.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getDefaultRoyaltyInfo(
  contractAddress: string,
  signer: Signer
) {
    const drop = Royalty__factory.connect(contractAddress, signer);

    return await drop.getDefaultRoyaltyInfo();
}

/**
 * Gets the royalty information for a specific token from a contract implementing the Royalty interface.
 *
 * @param contractAddress The address of the contract.
 * @param tokenId The token ID to get the royalty information for.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getRoyaltyInfoForToken(
    contractAddress: string,
    tokenId: number,
    signer: Signer
) {
    const drop = Royalty__factory.connect(contractAddress, signer);

    return await drop.getRoyaltyInfoForToken(tokenId);
}

/**
 * Gets the royalty information for a specific token from a contract implementing the Royalty interface.
 *
 * @param contractAddress The address of the contract.
 * @param tokenId The token ID to get the royalty information for.
 * @param salePrice The sale price of the token.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getRoyaltyInfo(
  contractAddress: string,
  tokenId: number,
  salePrice: number,
  signer: Signer
) {
    const drop = Royalty__factory.connect(contractAddress, signer);

    return await drop.royaltyInfo(tokenId, salePrice);
}