import { Signer } from "ethers";
import { Drop__factory, DropERC1155__factory, DropERC721__factory, OpenEditionERC721FlatFee__factory } from "../typechain-types";

/** 
 * Gets the total supply of a known drop contract.
 *
 * @param contractType One of: "drop721", "drop1155", "openedition"
 */
export async function totalSupply(
  contractAddress: string,
  contractType: "721" | "1155" | "oe",
  tokenId: number,
  signer: Signer
) {
    let contract;
    if (contractType === "721") {
        contract = DropERC721__factory.connect(contractAddress, signer);
    } else if (contractType === "1155") {
        contract = DropERC1155__factory.connect(contractAddress, signer);
        return await contract.totalSupply(tokenId);
    } else if (contractType === "oe") {
        contract = OpenEditionERC721FlatFee__factory.connect(contractAddress, signer);
    } else {
        throw new Error("Invalid contract type");
    }

    return await contract.totalSupply();
}