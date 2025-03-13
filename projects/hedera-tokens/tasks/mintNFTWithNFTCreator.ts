import { task } from "hardhat/config";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

task("mintNFTWithNFTCreator", "Creates a non-fungible token with fix fee using the precompiled contract")
  .setAction(async (_, hre) => {
    const signers = await hre.ethers.getSigners();
    const [deployer, feeCollector] = signers;

    console.log("Using deployer address:", deployer.address);
    const contractName = "RariNFTCreator";
    const tokenCreateFactory = await hre.ethers.getContractFactory(contractName) as RariNFTCreator__factory;
    const factoryAddress = (await hre.deployments.get(contractName)).address
    const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;
    const tokenAddress = "0x000000000000000000000000000000000057418a";
    // https://console.filebase.com/object/rarible-drops/Eclipse/cat/metadata/1.json
    // QmYVnaTG4Fo5kPxkuZCCUp7B5XT5P88aARQe44WcxYs11r

    // [
    //     Buffer.from("ipfs://QmYVnaTG4Fo5kPxkuZCCUp7B5XT5P88aARQe44WcxYs11r"),
    //   ]
    const mintTx = await rariNFTCreator.mintNft(tokenAddress);
    const txReceipt = await mintTx.wait();
    console.log("Mint tx hash", mintTx.hash);
    

    console.log("createNft task is not fully implemented. See TS code in comment above!");
});