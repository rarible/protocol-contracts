import { task } from "hardhat/config";

task("deploy-oe-c", "Deploys an OpenEditionERC721C contract via RaribleCloneFactory")
  .addParam("defaultAdmin", "Default admin address")
  .addParam("name", "Contract name")
  .addParam("symbol", "Contract symbol")
  .addParam("contractUri", "Base contract URI")
  .addOptionalParam("trustedForwarders", "Comma-separated list of trusted forwarder addresses")
  .addParam("saleRecipient", "Sale recipient address")
  .addParam("royaltyRecipient", "Royalty recipient address")
  .addParam("royaltyBps", "Royalty basis points (numeric)")
  .addOptionalParam("salt", "Salt value (default 0x)", "0x0000000000000000000000000000000000000000000000000000000000000000")
  .addOptionalParam("extraData", "Extra data in hex, default 0x", "0x")
  .addParam("cloneFactory", "RaribleCloneFactory address")
  .addParam("implementation", "Address of the OpenEditionERC721C logic contract")
  .setAction(async (args, hre) => {
    const {
      defaultAdmin,
      name,
      symbol,
      contractUri,
      trustedForwarders,
      saleRecipient,
      royaltyRecipient,
      royaltyBps,
      salt,
      extraData,
      cloneFactory,
      implementation
    } = args;

    const ethers = hre.ethers;
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    // parse the forwarders input
    let forwarders: string[] = [];
    if (trustedForwarders) {
      forwarders = trustedForwarders.split(",").map((addr: string) => addr.trim());
    }

    // get the clone factory address
    const cloneFactoryAddress = cloneFactory;

    // get the logic contract address
    const contractImplementation = implementation;

    // Now call the sdk method
    const { deployOEC } = await import("../sdk");
    const { logDeployment } = await import("../utils/logDeployment");

    const deployedAddress = await deployOEC(
      deployer,
      cloneFactoryAddress,
      contractImplementation,
      defaultAdmin,
      name,
      symbol,
      contractUri,
      forwarders,
      saleRecipient,
      royaltyRecipient,
      parseInt(royaltyBps),
      salt,
      extraData
    );

    logDeployment(hre.network.name, "OpenEditionERC721C", deployedAddress, name, contractUri, deployer.address);

    console.log("OpenEditionERC721C proxy deployed at:", deployedAddress);
  });
