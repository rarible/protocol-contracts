import { Signer } from "ethers";
import { ERC721AQueryableUpgradeable__factory } from "../typechain-types";

/**
 * Gets the tokens of an owner from an ERC721AQueryableUpgradeable contract.
 *
 * @param contractAddress The address of the ERC721AQueryableUpgradeable contract.
 * @param owner The owner of the tokens.
 * @param signer The signer or provider to use for the contract call.
 */
export async function tokensOfOwner(
  contractAddress: string,
  owner: string,
  signer: Signer
) {
    const drop = ERC721AQueryableUpgradeable__factory.connect(contractAddress, signer);

    return await drop.tokensOfOwner(owner);
}

export async function tokensOfOwnerIn(
    contractAddress: string,
    owner: string,
    start: number,
    end: number,
    signer: Signer
  ) {
      const drop = ERC721AQueryableUpgradeable__factory.connect(contractAddress, signer);
  
      return await drop.tokensOfOwnerIn(owner, start, end);
  }