import { Contract, Signer } from "ethers";
import { DropERC721__factory, DropERC1155__factory } from "../typechain-types";

/**
 * Updates the base URI of a batch in any compatible drop contract.
 *
 * @param contractAddress Address of the deployed drop contract
 * @param batchIndex Index of the batch to update
 * @param batchUri New base URI to assign to the batch
 * @param signer Signer to send the transaction
 * @returns Transaction receipt
 */
export async function updateBatchBaseURI(
  contractAddress: string,
  batchIndex: number,
  batchUri: string,
  signer: Signer,
  contractType: "721" | "1155"
) {
  let contract;
  if (contractType === "721") {
    contract = DropERC721__factory.connect(contractAddress, signer);
  } else if (contractType === "1155") {
    contract = DropERC1155__factory.connect(contractAddress, signer);
  } else {
    throw new Error("Invalid contract type");
  }
  const tx = await contract.updateBatchBaseURI(batchIndex, batchUri);
  const receipt = await tx.wait();
  return receipt;
}