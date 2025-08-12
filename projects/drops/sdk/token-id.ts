import { Signer } from "ethers";
import { Drop__factory, DropERC1155__factory, DropERC721__factory, OpenEditionERC721FlatFee__factory } from "../typechain-types";

/**
 * Gets the next token ID to claim from a Drop contract.
 *
 * @param contractType One of: "drop721", "openedition"
 */
export async function nextTokenIdToClaim(
  contractAddress: string,
  contractType: "721" | "oe",
  signer: Signer
) {
    let contract;
    if (contractType === "721") {
        contract = DropERC721__factory.connect(contractAddress, signer);
    } else if (contractType === "oe") {
        contract = OpenEditionERC721FlatFee__factory.connect(contractAddress, signer);
    } else {
        throw new Error("Invalid contract type");
    }

    return await contract.nextTokenIdToClaim();
}

/**
 * Gets the next token ID to mint from a Drop contract.
 *
 * @param contractType One of: "drop721", "drop1155", "openedition"
 */
export async function nextTokenIdToMint(
    contractAddress: string,
    contractType: "721" | "1155" | "oe",
    signer: Signer
  ) {
      let contract;
      if (contractType === "721") {
          contract = DropERC721__factory.connect(contractAddress, signer);
      } else if (contractType === "1155") {
          contract = DropERC1155__factory.connect(contractAddress, signer);
      } else if (contractType === "oe") {
          contract = OpenEditionERC721FlatFee__factory.connect(contractAddress, signer);
      } else {
          throw new Error("Invalid contract type");
      }
  
      return await contract.nextTokenIdToMint();
  }

/**
 * Gets the start token ID from an OpenEdition Drop contract.
 */
export async function startTokenId(
    contractAddress: string,
    signer: Signer
) {
    let contract = OpenEditionERC721FlatFee__factory.connect(contractAddress, signer);

    return await contract.startTokenId();
}