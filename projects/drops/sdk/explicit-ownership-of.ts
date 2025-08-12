import { Signer } from "ethers";
import { ERC721AQueryableUpgradeable__factory } from "../typechain-types";

/**
 * Gets the explicit ownership information for a given tokenId from an ERC721AQueryableUpgradeable contract.
 *
 * @param contractAddress The address of the ERC721AQueryableUpgradeable contract.
 * @param tokenId The token ID to query ownership for.
 * @param signer The signer or provider to use for the contract call.
 */
export async function explicitOwnershipOf(
  contractAddress: string,
  tokenId: number,
  signer: Signer
) {
    const drop = ERC721AQueryableUpgradeable__factory.connect(contractAddress, signer);

    return await drop.explicitOwnershipOf(tokenId);
}