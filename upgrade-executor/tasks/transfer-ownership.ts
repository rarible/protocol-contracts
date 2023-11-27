import "@nomiclabs/hardhat-ethers";
import { ethers } from "ethers";
import { IContractsTransfer, loadContractsTransferSettings } from '../utils/config';
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {ProxyAdmin, ProxyAdmin__factory} from "../typechain-types";
import {Ownable, Ownable__factory} from "../typechain-types";

// Define the task
task("transferOwnership", "Transfers ownership of contracts")
    .addParam("newOwner", "The address of the new owner")
    .addParam("settingsFile", "The path to the settings YAML file", "settings.yaml")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {

        const { newOwner, settingsFile } = taskArgs;
        const settings = await loadContractsTransferSettings(settingsFile) // Load settings from the YAML file or define them here

        const signers = await hre.ethers.getSigners();
        const signer = signers[0]; // Using the first signer by default

        await transferOwnership(settings, newOwner, signer)

    });

export async function transferOwnership(settings: IContractsTransfer, newOwner: string, signer: ethers.Signer) {
    try {
        // Transfer ownership of adminProxy
        console.log(`Transfering ownership of adminProxy to ${newOwner}`);
        const adminProxyContract = ProxyAdmin__factory.connect(settings.adminProxy, signer);
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

        console.log('Ownership transfer complete.');
    } catch (error) {
        console.error('Error during ownership transfer:', error);
        throw error;
    }
}
