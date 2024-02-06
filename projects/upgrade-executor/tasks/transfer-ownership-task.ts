import "@nomiclabs/hardhat-ethers";
import { ethers } from "ethers";
import {
  IContractsTransfer,
  loadContractsTransferSettings,
} from "../utils/config";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { transferOwnership } from "./transfer-ownership";
import { getSigner } from "../utils/get-signer";

// Define the task
task("transferOwnership", "Transfers ownership of contracts")
  .addParam("newOwner", "The address of the new owner")
  .addParam(
    "settingsFile",
    "The path to the settings YAML file",
    "settings.yaml"
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { newOwner, settingsFile } = taskArgs;
    const settings = await loadContractsTransferSettings(settingsFile); // Load settings from the YAML file or define them here
    const signer = await getSigner(hre)
    await transferOwnership(settings, newOwner, signer);
  });
