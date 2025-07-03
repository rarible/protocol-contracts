import { task } from "hardhat/config";
import { logDeployment } from "../utils/logDeployment";
task("deploy-drop721", "Deploys a DropERC721 contract via TWCloneFactory")
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
  .addParam("implementation", "Address of the DropERC721 logic contract", "")
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
      implementation
    } = args;

    const ethers = hre.ethers;
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    // parse the forwarders input
    let forwarders = [];
    if (trustedForwarders) {
      forwarders = trustedForwarders.split(",").map((addr: string) => addr.trim());
    }

    // get the clone factory address
    let cloneFactoryAddress = cloneFactory;

    // get the logic contract address
    let contractImplementation = implementation;

    // Now call the sdk method
    const { deployDrop721 } = await import("../sdk");

    const deployedAddress = await deployDrop721(
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

    logDeployment(hre.network.name, "DropERC721", deployedAddress, name, contractUri, deployer.address);

    console.log("DropERC721 proxy deployed at:", deployedAddress);
  });