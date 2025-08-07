import { Signer } from "ethers";
import { Drop__factory, DropERC1155__factory, DropERC721__factory, OpenEditionERC721FlatFee__factory } from "../typechain-types";

/**
 * Gets the token URI for a given token ID from a known drop contract.
 *
 * @param contractType One of: "drop721", "openedition"
 */
export async function tokenURI(
  contractAddress: string,
  contractType: "721" | "oe",
  tokenId: number,
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

    return await contract.tokenURI(tokenId);
}