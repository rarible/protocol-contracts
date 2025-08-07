import { Signer } from "ethers";
import { Permissions__factory, PermissionsEnumerable__factory } from "../typechain-types";

/**
 * Gets the role admin from a contract implementing the Permissions interface.
 *
 * @param contractAddress The address of the contract.
 * @param role The role to get the admin for.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getRoleAdmin(
  contractAddress: string,
  role: string,
  signer: Signer
) {
    const drop = Permissions__factory.connect(contractAddress, signer);

    return await drop.getRoleAdmin(role);
}

/**
 * Gets a role member from a contract implementing the PermissionsEnumerable interface.
 *
 * @param contractAddress The address of the contract.
 * @param role The role to get the member for.
 * @param index The index of the member to get.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getRoleMember(
  contractAddress: string,
  role: string,
  index: number,
  signer: Signer
) {
    const drop = PermissionsEnumerable__factory.connect(contractAddress, signer);

    return await drop.getRoleMember(role, index);
}

/**
 * Gets the number of role members from a contract implementing the PermissionsEnumerable interface.
 *
 * @param contractAddress The address of the contract.
 * @param role The role to get the member count for.
 * @param signer The signer or provider to use for the contract call.
 */
export async function getRoleMemberCount(
  contractAddress: string,
  role: string,
  signer: Signer
) {
    const drop = PermissionsEnumerable__factory.connect(contractAddress, signer);

    return await drop.getRoleMemberCount(role);
}

/**
 * Checks if an account has a specific role from a contract implementing the Permissions interface.
 *
 * @param contractAddress The address of the contract.
 * @param role The role to check.
 * @param account The account to check.
 * @param signer The signer or provider to use for the contract call.
*/
export async function hasRole(
  contractAddress: string,
  role: string,
  account: string,
  signer: Signer
) {
    const drop = Permissions__factory.connect(contractAddress, signer);

    return await drop.hasRole(role, account);
}

/**
 * Checks if an account has a specific role with switch from a contract implementing the Permissions interface.
 *
 * @param contractAddress The address of the contract.
 * @param role The role to check.
 * @param account The account to check.
 * @param signer The signer or provider to use for the contract call.
 */
export async function hasRoleWithSwitch(
  contractAddress: string,
  role: string,
  account: string,
  signer: Signer
) {
    const drop = Permissions__factory.connect(contractAddress, signer);

    return await drop.hasRoleWithSwitch(role, account);
}