import { task } from "hardhat/config";

task("factory:create", "Create a new collection via the factory")
  .addParam("factory", "Factory contract address")
  .addParam("name", "Collection name")
  .addParam("symbol", "Collection symbol")
  .addOptionalParam("description", "Collection description", "")
  .addOptionalParam("icon", "Collection icon URL", "")
  .addOptionalParam("tokenName", "Token metadata name", "")
  .addOptionalParam("tokenDescription", "Token metadata description", "")
  .addOptionalParam("tokenImage", "Token metadata image URL", "")
  .addOptionalParam("skipVerify", "Skip verification", "false")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const { formatTxLink, formatAddressLink } = await import("../utils");
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const client = FactoryClient.connect(args.factory, signers[0]);

    // Read factory defaults to build constructor args for verification
    const defaults = await client.getDefaults();

    const result = await client.createCollection({
      name: args.name,
      symbol: args.symbol,
      description: args.description,
      icon: args.icon,
      tokenMetaName: args.tokenName,
      tokenMetaDescription: args.tokenDescription,
      tokenMetaImage: args.tokenImage,
    });

    console.log("\n=== Collection Created ===");
    console.log(`  Address:  ${result.collectionAddress}`);
    console.log(`  Creator:  ${result.creator}`);
    console.log(`  Name:     ${result.name}`);
    console.log(`  Symbol:   ${result.symbol}`);
    console.log(`  Tx:       ${formatTxLink(chainId, result.tx.hash)}`);
    console.log(`  Explorer: ${formatAddressLink(chainId, result.collectionAddress)}`);

    // Auto-verify on Sourcify + BaseScan
    if (args.skipVerify !== "true" && hre.network.name !== "hardhat") {
      console.log("\nVerifying contract...");

      // ABI-encode constructor arguments matching LiveDropCollection constructor
      const constructorArgs = ethers.utils.defaultAbiCoder
        .encode(
          [
            "string", "string", "address", "address", "address",
            "uint16", "uint256", "uint256", "address",
            "address", "uint96",
            "string", "string", "string", "string", "string",
          ],
          [
            args.name,
            args.symbol,
            result.creator, // owner
            args.factory, // factory
            defaults.feeRecipient,
            defaults.feeBps,
            defaults.feeFixedNative,
            defaults.feeFixedErc20,
            defaults.erc20,
            result.creator, // royalty receiver
            1000, // default royalty bps
            args.description,
            args.icon,
            args.tokenName,
            args.tokenDescription,
            args.tokenImage,
          ]
        )
        .slice(2); // remove 0x prefix

      try {
        await hre.run("verify:sourcify", {
          address: result.collectionAddress,
          contract: "LiveDropCollection",
          constructorArgs,
        });
      } catch (err: any) {
        console.error(`Verification failed: ${err.message || err}`);
        console.log(
          "You can verify manually:\n  npx hardhat verify:sourcify --address " +
            result.collectionAddress +
            " --contract LiveDropCollection --constructor-args " +
            constructorArgs.substring(0, 40) + "..." +
            " --network " +
            hre.network.name
        );
      }
    }

    console.log("");
  });
