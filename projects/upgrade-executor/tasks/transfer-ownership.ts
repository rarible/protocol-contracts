import "@nomiclabs/hardhat-ethers";
import { ethers } from "ethers";
import { IContractsTransfer } from "../utils/config";
import { Ownable__factory } from "../typechain-types";
import { AccessControlUpgradeable__factory } from "../typechain-types";
import { expect } from "chai";

export async function transferOwnership(
  settings: IContractsTransfer,
  newOwner: string,
  signer: ethers.Signer
) {
  try {
    // Transfer ownership of each contract in contracts
    for (const [key, address] of Object.entries(settings.ownable)) {
      console.log(`Transfering ownership of ${key} to ${newOwner}`);
      const contract = Ownable__factory.connect(address, signer);
      const tx = await contract.transferOwnership(newOwner);
      console.log(`Transfering ownership wait 5 confirmations`);
      await tx.wait(5)
      console.log(`Ownership of ${key} transferred successfully`);
    }

    // Transfer ownership of each access contract
    for (const [key, address] of Object.entries(settings.accessControl)) {
      console.log(`Add admin role of ${key} to ${newOwner}`);
      const contract = AccessControlUpgradeable__factory.connect(address, signer);
      const TIMELOCK_ADMIN_ROLE = ethers.utils.id("TIMELOCK_ADMIN_ROLE");
      const tx = await contract.grantRole(TIMELOCK_ADMIN_ROLE, newOwner)
      console.log(`Add admin role: wait 5 confirmations`);
      await tx.wait(5)
      console.log(`Add admin role of ${key} successfully`);

      const oldOwner = await signer.getAddress();

      //now renouncing admin role
      const tx2 = await contract.renounceRole(TIMELOCK_ADMIN_ROLE, oldOwner)
      console.log(`Renounce admin role: wait 5 confirmations`);
      await tx2.wait(5)
      console.log(`Renounce admin role of ${key} successfully`);
    }

    console.log("Ownership transfer complete.");
    console.log()
  } catch (error) {
    console.error("Error during ownership transfer:", error);
    throw error;
  }
}

export async function transferSingleContractOwnership(
  contractAddress: string,
  newOwner: string,
  signer: ethers.Signer 
) {
  console.log(`Transfering ownership of contract (${contractAddress}) to newOwner=${newOwner}`);
  const contract = Ownable__factory.connect(contractAddress, signer);
  const tx = await contract.transferOwnership(newOwner);
  await tx.wait()
  expect(await contract.owner()).to.equal(newOwner);
  console.log(`Ownership of contract (${contractAddress}) transferred successfully`)
}

export async function transferTimelockAdminRole(
  contractAddress: string,
  newOwner: string,
  signer: ethers.Signer 
) {
  console.log(`Adding admin role in contract(${contractAddress}) to ${newOwner}`);
  const contract = AccessControlUpgradeable__factory.connect(contractAddress, signer);
  const TIMELOCK_ADMIN_ROLE = ethers.utils.id("TIMELOCK_ADMIN_ROLE");
  const tx = await contract.grantRole(TIMELOCK_ADMIN_ROLE, newOwner)
  await tx.wait()
  expect(await contract.hasRole(TIMELOCK_ADMIN_ROLE, newOwner)).to.equal(true);
  console.log(`Adding admin role in ${contractAddress} successfully`);
}

export async function renounceTimelockAdminRole(
  contractAddress: string,
  oldOwner: string,
  signer: ethers.Signer 
) {
  console.log(`Renouncing admin role in ${contractAddress} from ${oldOwner}`);
  const contract = AccessControlUpgradeable__factory.connect(contractAddress, signer);
  const TIMELOCK_ADMIN_ROLE = ethers.utils.id("TIMELOCK_ADMIN_ROLE");
  const tx = await contract.renounceRole(TIMELOCK_ADMIN_ROLE, oldOwner)
  await tx.wait()
  expect(await contract.hasRole(TIMELOCK_ADMIN_ROLE, oldOwner)).to.equal(false);
  console.log(`Renouncing admin role in ${contractAddress} successfully`);
}