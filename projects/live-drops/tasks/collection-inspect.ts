import { task } from "hardhat/config";

task("collection:inspect", "Inspect full state of a collection")
  .addParam("address", "Collection contract address")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const { ethers } = hre;
    const signers = await ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    const state = await client.getState();

    console.log("\n=== Collection State ===");
    console.log(`  Address:              ${state.address}`);
    console.log(`  Name:                 ${state.name}`);
    console.log(`  Symbol:               ${state.symbol}`);
    console.log(`  Owner:                ${state.owner}`);
    console.log(`  Factory:              ${state.factory}`);
    console.log(`  Paused:               ${state.paused}`);
    console.log(`  Total Supply:         ${state.totalSupply}`);
    console.log("");
    console.log("--- Fee Configuration ---");
    console.log(`  Fee Recipient:        ${state.feeRecipient}`);
    console.log(`  Fee BPS:              ${state.feeBps} (${state.feeBps / 100}%)`);
    console.log(`  Fixed Native Fee:     ${state.feeFixedNative} wei (${ethers.utils.formatEther(state.feeFixedNative)} ETH)`);
    console.log(`  Fixed ERC-20 Fee:     ${state.feeFixedErc20}`);
    console.log(`  ERC-20 Token:         ${state.erc20Token}`);
    console.log("");
    console.log("--- Royalty ---");
    console.log(`  Receiver:             ${state.royaltyReceiver}`);
    console.log(`  BPS:                  ${state.royaltyBps} (${state.royaltyBps.toNumber() / 100}%)`);
    console.log("");
    console.log("--- Collection Metadata ---");
    console.log(`  Description:          ${state.collectionDescription}`);
    console.log(`  Icon:                 ${state.collectionIcon}`);
    console.log("");
    console.log("--- Token Metadata ---");
    console.log(`  Name:                 ${state.tokenMetaName}`);
    console.log(`  Description:          ${state.tokenMetaDescription}`);
    console.log(`  Image:                ${state.tokenMetaImage}`);
    console.log("");
  });
