import { Contract, Signer } from "ethers";

/**
 * Minimal ABI with updateBatchBaseURI(uint256, string)
 */
const updateBatchBaseURIAbi = [
  "function updateBatchBaseURI(uint256 _index, string calldata _uri) external",
];

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
  signer: Signer
) {
  const contract = new Contract(contractAddress, updateBatchBaseURIAbi, signer);
  const tx = await contract.updateBatchBaseURI(batchIndex, batchUri);
  const receipt = await tx.wait();
  return receipt;
}