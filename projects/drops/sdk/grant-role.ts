import { Signer, BytesLike } from "ethers";
import { Permissions__factory } from "../typechain-types";

/**
 * Grants a role to an address on any contract that implements `grantRole`.
 *
 * @param contractAddress Address of the deployed contract
 * @param role Bytes32 role to grant (e.g., ethers.utils.id("MINTER_ROLE"))
 * @param account Address to grant the role to
 * @param signer Signer to use for sending the transaction
 */
export async function grantRole(
  contractAddress: string,
  role: BytesLike,
  account: string,
  signer: Signer
): Promise<void> {
  const contract = Permissions__factory.connect(contractAddress, signer);

  const tx = await contract.grantRole(role, account);
  console.log(`Granting role… tx hash: ${tx.hash}`);

  await tx.wait();
  console.log(`✅ Role granted to ${account} on contract ${contractAddress}`);
}
