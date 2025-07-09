import { Contract, Signer, BytesLike } from "ethers";

// Minimal ABI for grantRole function
const accessControlAbi = [
  "function grantRole(bytes32 role, address account) external",
];

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
  const contract = new Contract(contractAddress, accessControlAbi, signer);

  const tx = await contract.grantRole(role, account);
  console.log(`Granting role… tx hash: ${tx.hash}`);

  await tx.wait();
  console.log(`Role granted to ${account} on contract ${contractAddress}`);
}
