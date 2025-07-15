import { Signer, BytesLike } from "ethers";
import { connectWithDropContract } from "../utils/contractLoader";
import { DropContractType } from "../types/drop-types";

/**
 * Grants a role to an address using a known contract type.
 *
 * @param contractAddress Address of the deployed contract
 * @param role Role bytes32
 * @param account Target address
 * @param signer Signer
 * @param contractType Optional known contract type ("drop721" | "drop1155" | "openedition")
 */
export async function grantRole(
  contractAddress: string,
  role: BytesLike,
  account: string,
  signer: Signer,
  contractType?: DropContractType
): Promise<void> {
  const contract = connectWithDropContract(contractAddress, signer, contractType);

  const tx = await contract.grantRole(role, account);
  console.log(`Granting role… tx hash: ${tx.hash}`);

  await tx.wait();
  console.log(`✅ Role granted to ${account} on contract ${contractAddress}`);
}
