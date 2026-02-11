import { task } from "hardhat/config";

task("factory:deploy", "Deploy a new LiveDropFactory contract")
  .addParam("feeRecipient", "Rarible fee recipient address")
  .addParam("erc20", "Default ERC-20 token address (e.g. USDC)")
  .addOptionalParam("feeBps", "Default fee basis points", "500")
  .addOptionalParam("fixedNative", "Default fixed native fee in wei", "0")
  .addOptionalParam("fixedErc20", "Default fixed ERC-20 fee in token units", "0")
  .setAction(async (args, hre) => {
    const { FactoryClient } = await import("../sdk");
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];

    console.log(`\nDeployer: ${deployer.address}`);
    console.log(`Network: ${hre.network.name}\n`);

    const client = await FactoryClient.deploy(
      deployer,
      deployer.address,
      args.feeRecipient,
      parseInt(args.feeBps),
      args.fixedNative,
      args.fixedErc20,
      args.erc20
    );

    console.log(`\nFactory address: ${client.address}`);
  });
