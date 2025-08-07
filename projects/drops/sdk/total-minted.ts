import { Signer } from "ethers";
import { Drop__factory, DropERC1155__factory, DropERC721__factory, OpenEditionERC721FlatFee__factory } from "../typechain-types";

/**
 * Gets the total minted amount from a Drop contract.
 *
 * @param contractType One of: "drop721", "openedition"
 */
export async function totalMinted(
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

    return await contract.totalMinted();
}