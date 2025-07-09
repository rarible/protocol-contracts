import { Contract, Signer } from "ethers";

/**
 * Minimal ABI for calling setSharedMetadata with a SharedMetadataInfo struct
 */
const sharedMetadataAbi = [
  "function setSharedMetadata((string name,string description,string imageURI,string animationURI) metadata) external",
];

/**
 * Sends a transaction to update the shared metadata in any compatible contract.
 *
 * @param contractAddress Address of the deployed contract
 * @param metadata Object matching SharedMetadataInfo structure
 * @param signer Signer with permission to update the metadata
 * @returns Transaction receipt
 */
export async function setSharedMetadata(
  contractAddress: string,
  metadata: {
    name: string;
    description: string;
    imageURI: string;
    animationURI: string;
  },
  signer: Signer
) {
  const contract = new Contract(contractAddress, sharedMetadataAbi, signer);
  const tx = await contract.setSharedMetadata(metadata);
  const receipt = await tx.wait();
  return receipt;
}
