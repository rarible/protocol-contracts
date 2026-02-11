import { task } from "hardhat/config";

task("collection:set-fees", "Update fee configuration on a collection")
  .addParam("address", "Collection contract address")
  .addParam("bps", "Fee basis points (0-10000)")
  .addOptionalParam("fixedNative", "Fixed native fee in wei", "0")
  .addOptionalParam("fixedErc20", "Fixed ERC-20 fee in token units", "0")
  .setAction(async (args, hre) => {
    const { CollectionClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = CollectionClient.connect(args.address, signers[0]);
    await client.setFees(parseInt(args.bps), args.fixedNative, args.fixedErc20);
  });
