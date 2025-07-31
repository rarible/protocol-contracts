import { Signer } from "ethers";
import { ContractMetadata__factory } from "../typechain-types";

/**
 * Sets ContractURI of a contract that uses ContractMetadata external contract.
 *
 * @param contractAddress The address of the Ownable contract
 * @param contractURI The contract URI to set
 * @param signer A signer that is the current owner
 */
export async function setContractURI(
  contractAddress: string,
  contractURI: string,
  signer: Signer
): Promise<void> {
  const contract = ContractMetadata__factory.connect(contractAddress, signer);
  const tx = await contract.setContractURI(contractURI);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ ContractURI set as ${contractURI}`);
}