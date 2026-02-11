import { task } from "hardhat/config";

task("factory:set-erc20", "Update factory default ERC-20 token")
  .addParam("factory", "Factory contract address")
  .addParam("token", "New default ERC-20 token address")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();

    const client = FactoryClient.connect(args.factory, signers[0]);
    await client.setDefaultErc20(args.token);
  });
