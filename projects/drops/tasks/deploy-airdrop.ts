import { task } from "hardhat/config";

task("deploy-airdrop", "Deploys an Airdrop contract via RaribleCloneFactory")
  .addParam("defaultAdmin", "Default admin address")
  .addParam("contractUri", "Contract URI")
  .addOptionalParam("salt", "Salt value (default 0x)", "0x0000000000000000000000000000000000000000000000000000000000000000")
  .addOptionalParam("extraData", "Extra data in hex, default 0x", "0x")
  .addParam("cloneFactory", "RaribleCloneFactory address if not using deployments", "")
  .addParam("implementation", "Address of the Airdrop logic contract", "")
  .setAction(async (args, hre) => {
    const {
      defaultAdmin,
      contractUri,
      salt,
      extraData,
      cloneFactory,
      implementation
    } = args;

    const ethers = hre.ethers;
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    // get the clone factory address
    let cloneFactoryAddress = cloneFactory;

    // get the logic contract address
    let contractImplementation = implementation;

    // Now call the sdk method
    const { deployAirdrop } = await import("../sdk");
    const { logDeployment } = await import("../utils/logDeployment");

    const deployedAddress = await deployAirdrop(
      deployer,
      cloneFactoryAddress,
      contractImplementation,
      defaultAdmin,
      contractUri,
      salt,
      extraData
    );

    logDeployment(hre.network.name, "Airdrop", deployedAddress, "Airdrop", contractUri, deployer.address);

    console.log("Airdrop proxy deployed at:", deployedAddress);
  });
