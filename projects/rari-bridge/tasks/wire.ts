import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLedgerSigner } from "@rarible/deploy-utils";
import { OFTCore__factory, OFTCore } from "../typechain-types";
import { addressToBytes32 } from "../utils";
import { EndpointId, EndpointVersion, getNetworkForChainId, networkToEndpointId } from "@layerzerolabs/lz-definitions";
import { getEndpointV2IdByChainId } from "../utils";

task("wire", "Set peer for RARI OFT bridge")
  .addParam("contract", "Contract address (Adapter or OFT)")
  .addParam("target", "Target contract address on remote chain")
  .addParam("targetChainId", "Target endpoint ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const oft: OFTCore = OFTCore__factory.connect(taskArgs.contract, getLedgerSigner(ethers.provider, "m/44'/60'/0'/0/0")); // OFTCore ABI for setPeer

    const targetBytes32 = addressToBytes32(taskArgs.target);

    // // 1) Figure out the LayerZero "network" name from the EVM chainId
    // //    e.g. 8453 -> { chainName: 'base', env: 'mainnet', ... } -> 'base-mainnet'
    const chainIdNum = Number(taskArgs.targetChainId);
    const targetEndpointId = getEndpointV2IdByChainId(chainIdNum);

    const tx = await oft.setPeer(targetEndpointId, targetBytes32);
    await tx.wait();

    console.log(`Peer set: ${taskArgs.target} on eid ${targetEndpointId} for chainId ${chainIdNum}`);
  });