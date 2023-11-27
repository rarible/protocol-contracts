import "@nomiclabs/hardhat-ethers";
import { ethers } from "ethers";
import { IContractsTransfer } from "../utils/config";
import { ProxyAdmin__factory } from "../typechain-types";
import { Ownable__factory } from "../typechain-types";

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
    await adminProxyContract.transferOwnership(newOwner);
    console.log(`Ownership of adminProxy transferred successfully`);

    // Transfer ownership of each contract in contracts
    for (const [key, address] of Object.entries(settings.contracts)) {
      console.log(`Transfering ownership of ${key} to ${newOwner}`);
      const contract = Ownable__factory.connect(address, signer);
      await contract.transferOwnership(newOwner);
      console.log(`Ownership of ${key} transferred successfully`);
    }

    // Transfer ownership of each nonupgradable contract
    for (const [key, address] of Object.entries(settings.nonupgradable)) {
      console.log(`Transfering ownership of ${key} to ${newOwner}`);
      const contract = Ownable__factory.connect(address, signer);
      await contract.transferOwnership(newOwner);
      console.log(`Ownership of ${key} transferred successfully`);
    }


    // TODO: Add Access control set Admin and remove Admin

    console.log("Ownership transfer complete.");
  } catch (error) {
    console.error("Error during ownership transfer:", error);
    throw error;
  }
}
