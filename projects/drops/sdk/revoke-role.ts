import { Contract, Signer, BytesLike } from "ethers";
import { connectWithDropContract } from "../utils/contractLoader";
import { DropContractType } from "../types/drop-types";

/**
 * Revokes a role from an address on any contract that implements `revokeRole`.
 *
 * @param contractAddress The deployed contract address
 * @param role The role to revoke (e.g. ethers.utils.id("MINTER_ROLE") or 0x00 for admin)
 * @param account The address to revoke the role from
 * @param signer A signer with permission to revoke roles (must have DEFAULT_ADMIN_ROLE)
 */
export async function revokeRole(
  contractAddress: string,
  role: BytesLike,
  account: string,
  signer: Signer,
  contractType?: DropContractType
): Promise<void> {
  const contract = connectWithDropContract(contractAddress, signer, contractType);
  const tx = await contract.revokeRole(role, account);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Role ${role} revoked from ${account} on ${contractAddress}`);
}
