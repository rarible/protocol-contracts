import { task } from "hardhat/config";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

task("mintNFT", "Mint a non-fungible token with fix fee using the precompiled contract")
  .addParam("tokenAddress", "The address of the token to mint")
  .setAction(async (params, hre) => {
    const signers = await hre.ethers.getSigners();
    const [deployer, feeCollector] = signers;

    console.log("Using deployer address:", deployer.address);
    const contractName = "RariNFTCreator";
    const tokenCreateFactory = await hre.ethers.getContractFactory(contractName) as RariNFTCreator__factory;
    const factoryAddress = (await hre.deployments.get(contractName)).address
    const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;
    const tokenAddress = params.tokenAddress;
    
    const mintTx = await rariNFTCreator.mintNft(tokenAddress);
    console.log("Mint tx hash", mintTx.hash);
    

    console.log("createNft task is not fully implemented. See TS code in comment above!");
});