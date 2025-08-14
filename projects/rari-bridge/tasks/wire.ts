import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("wire", "Set peer for RARI OFT bridge")
  .addParam("source", "Source contract address (Adapter or OFT)")
  .addParam("target", "Target contract address on remote chain")
  .addParam("targeteid", "Target endpoint ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const oft = await ethers.getContractAt("OFTCore", taskArgs.source); // OFTCore ABI for setPeer

    const targetBytes32 = ethers.utils.defaultAbiCoder.encode(["address"], [taskArgs.target]).slice(0, 66);
    const tx = await oft.setPeer(taskArgs.targeteid, targetBytes32);
    await tx.wait();

    console.log(`Peer set: ${taskArgs.target} on eid ${taskArgs.targeteid}`);
  });