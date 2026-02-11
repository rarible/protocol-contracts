import { task } from "hardhat/config";

task("collection:mint-native", "Mint an NFT by paying with native ETH")
  .addParam("address", "Collection contract address")
  .addParam("amount", "Payment amount in ETH (e.g. '0.1')")
  .addOptionalParam("to", "NFT recipient (defaults to sender)")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const { formatTxLink } = await import("../utils");
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const to = args.to || signers[0].address;
    const amount = ethers.utils.parseEther(args.amount);

    const client = CollectionClient.connect(args.address, signers[0]);
    const result = await client.mintNative(to, amount);

    console.log("\n=== Mint Result ===");
    console.log(`  Token ID: ${result.tokenId}`);
    console.log(`  To:       ${result.to}`);
    console.log(`  Amount:   ${ethers.utils.formatEther(result.amount)} ETH`);
    console.log(`  Fee:      ${ethers.utils.formatEther(result.fee)} ETH`);
    console.log(`  Tx:       ${formatTxLink(chainId, result.tx.hash)}`);
    console.log("");
  });
