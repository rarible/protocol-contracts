import { Signer } from "ethers";
import { ERC721AUpgradeable__factory } from "../typechain-types";

/**
 * Checks if an operator is approved for all tokens from an ERC721AUpgradeable contract.
 *
 * @param contractAddress The address of the ERC721AUpgradeable contract.
 * @param owner The owner of the tokens.
 * @param operator The operator to check approval for.
 * @param signer The signer or provider to use for the contract call.
 */
export async function isApprovedForAll(
  contractAddress: string,
  owner: string,
  operator: string,
  signer: Signer
) {
    const drop = ERC721AUpgradeable__factory.connect(contractAddress, signer);

    return await drop.isApprovedForAll(owner, operator);
}