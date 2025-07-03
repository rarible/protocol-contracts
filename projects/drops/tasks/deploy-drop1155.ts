import { task } from "hardhat/config";
import { logDeployment } from "../utils/logDeployment";
task("deploy-drop1155", "Deploys a DropERC1155 contract via TWCloneFactory")
  .addParam("defaultAdmin", "Default admin address")
  .addParam("name", "Contract name")
  .addParam("symbol", "Contract symbol")
  .addParam("contractUri", "Base contract URI")
  .addOptionalParam("trustedForwarders", "Comma-separated list of trusted forwarder addresses")
  .addParam("saleRecipient", "Sale recipient address")
  .addParam("royaltyRecipient", "Royalty recipient address")
  .addParam("royaltyBps", "Royalty basis points (numeric)")
  .addParam("platformFeeBps", "Platform fee basis points (numeric)")
  .addParam("platformFeeRecipient", "Platform fee recipient address")
  .addOptionalParam("salt", "Salt value (default 0x)", "0x0000000000000000000000000000000000000000000000000000000000000000")
  .addOptionalParam("extraData", "Extra data in hex, default 0x", "0x")
  .addParam("cloneFactory", "TWCloneFactory address if not using deployments", "")
  .addParam("implementation", "Address of the DropERC1155 logic contract", "")
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
      platformFeeBps,
      platformFeeRecipient,
      salt,
      extraData,
      cloneFactory,
      implementation,
    } = args;

    const ethers = hre.ethers;
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    // Parse the forwarders input
    let forwarders: string[] = [];
    if (trustedForwarders) {
      forwarders = trustedForwarders.split(",").map((addr: string) => addr.trim());
    }

    // Get the clone factory address
    let cloneFactoryAddress = cloneFactory;

    // Get the logic contract address
    let contractImplementation = implementation;

    // Call the SDK method
    const { deployDrop1155 } = await import("../sdk");

    const deployedAddress = await deployDrop1155(
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
      parseInt(platformFeeBps),
      platformFeeRecipient,
      salt,
      extraData
    );

    logDeployment(hre.network.name, "DropERC1155", deployedAddress, name, contractUri, deployer.address);

    console.log("DropERC1155 proxy deployed at:", deployedAddress);
  });