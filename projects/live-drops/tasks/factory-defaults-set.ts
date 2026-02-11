import { task } from "hardhat/config";

task("factory:defaults:set", "Update factory default fee configuration")
  .addParam("factory", "Factory contract address")
  .addParam("feeBps", "Fee basis points (0-10000)")
  .addParam("fixedNative", "Fixed native fee in wei")
  .addParam("fixedErc20", "Fixed ERC-20 fee in token units")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = FactoryClient.connect(args.factory, signers[0]);
    await client.setDefaultFees(
      parseInt(args.feeBps),
      args.fixedNative,
      args.fixedErc20
    );
  });
