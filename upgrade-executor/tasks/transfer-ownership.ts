import "@nomiclabs/hardhat-ethers";
import { ethers } from "ethers";
import { IContractsTransfer } from "../utils/config";
import { ProxyAdmin__factory } from "../typechain-types";
import { Ownable__factory } from "../typechain-types";
import { AccessControlUpgradeable__factory } from "../typechain-types";

export async function transferOwnership(
  settings: IContractsTransfer,
  newOwner: string,
  signer: ethers.Signer
) {
  try {
    // Transfer ownership of adminProxy
    console.log(`Transfering ownership of adminProxy to ${newOwner}`);
    const adminProxyContract = ProxyAdmin__factory.connect(
      settings.adminProxy,
      signer
    );
    const tx = await adminProxyContract.transferOwnership(newOwner);
    console.log(`Transfering ownership wait 5 confirmations`);
    await tx.wait(5)
    console.log(`Ownership of adminProxy transferred successfully`);

    // Transfer ownership of each contract in contracts
    for (const [key, address] of Object.entries(settings.contracts)) {
      console.log(`Transfering ownership of ${key} to ${newOwner}`);
      const contract = Ownable__factory.connect(address, signer);
      const tx = await contract.transferOwnership(newOwner);
      console.log(`Transfering ownership wait 5 confirmations`);
      await tx.wait(5)
      console.log(`Ownership of ${key} transferred successfully`);
    }

    // Transfer ownership of each nonupgradable contract
    for (const [key, address] of Object.entries(settings.nonupgradable)) {
      console.log(`Transfering ownership of ${key} to ${newOwner}`);
      const contract = Ownable__factory.connect(address, signer);
      const tx = await contract.transferOwnership(newOwner);
      console.log(`Transfering ownership wait 5 confirmations`);
      await tx.wait(5)
      console.log(`Ownership of ${key} transferred successfully`);
    }
    
    // Transfer ownership of each nonupgradable contract
    for (const [key, address] of Object.entries(settings.accessControl)) {
        console.log(`Add admin role of ${key} to ${newOwner}`);
        const contract = AccessControlUpgradeable__factory.connect(address, signer);
        const DEFAULT_ADMIN_ROLE = ethers.utils.id("DEFAULT_ADMIN_ROLE");
        const tx = await contract.grantRole(DEFAULT_ADMIN_ROLE, newOwner)
        console.log(`Add admin role: wait 5 confirmations`);
        await tx.wait(5)
        console.log(`Add admin role of ${key} successfully`);
    }

    console.log("Ownership transfer complete.");
  } catch (error) {
    console.error("Error during ownership transfer:", error);
    throw error;
  }
}
