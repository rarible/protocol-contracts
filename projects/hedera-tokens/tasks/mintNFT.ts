import { task } from "hardhat/config";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

task("mintNFT", "Mint a non-fungible token with fix fee using the precompiled contract")
  .addParam("collectionAddress", "The address of the token to mint")
  .setAction(async (params, hre) => {
    const signers = await hre.ethers.getSigners();
    const [deployer, feeCollector] = signers;

    console.log("Using deployer address:", deployer.address);
    const contractName = "RariNFTCreator";
    const tokenCreateFactory = await hre.ethers.getContractFactory(contractName) as RariNFTCreator__factory;
    const factoryAddress = (await hre.deployments.get(contractName)).address
    const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;
    const collectionAddress = params.collectionAddress;
    
    const mintTx = await rariNFTCreator.mintNft(collectionAddress, {gasLimit: 4_000_000});

    const txReceipt = await mintTx.wait();
    console.log("Mint tx hash", mintTx.hash);
});