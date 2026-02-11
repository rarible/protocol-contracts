import { task } from "hardhat/config";

task("collection:mint-erc20", "Mint an NFT by paying with ERC-20 (e.g. USDC)")
  .addParam("address", "Collection contract address")
  .addParam("amount", "Payment amount in human-readable units (e.g. '10' for 10 USDC)")
  .addOptionalParam("decimals", "Token decimals (default: 6 for USDC)", "6")
  .addOptionalParam("to", "NFT recipient (defaults to sender)")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const { formatTxLink } = await import("../utils");
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const to = args.to || signers[0].address;
    const decimals = parseInt(args.decimals);
    const amount = ethers.utils.parseUnits(args.amount, decimals);

    console.log(`\nAmount in smallest units: ${amount} (${args.amount} with ${decimals} decimals)`);

    const client = CollectionClient.connect(args.address, signers[0]);
    const result = await client.mintErc20(to, amount);

    console.log("\n=== Mint Result ===");
    console.log(`  Token ID: ${result.tokenId}`);
    console.log(`  To:       ${result.to}`);
    console.log(`  Amount:   ${ethers.utils.formatUnits(result.amount, decimals)} tokens`);
    console.log(`  Fee:      ${ethers.utils.formatUnits(result.fee, decimals)} tokens`);
    console.log(`  Tx:       ${formatTxLink(chainId, result.tx.hash)}`);
    console.log("");
  });
