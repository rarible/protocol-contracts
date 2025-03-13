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
    const tokenAddress = "0x00000000000000000000000000000000005741BF";
    // https://console.filebase.com/object/rarible-drops/Eclipse/cat/metadata/1.json
    // QmYVnaTG4Fo5kPxkuZCCUp7B5XT5P88aARQe44WcxYs11r

    // [
    //     Buffer.from("ipfs://QmYVnaTG4Fo5kPxkuZCCUp7B5XT5P88aARQe44WcxYs11r"),
    //   ]
    //const mintTx = await rariNFTCreator.mintNftWithMetadata(tokenAddress, [Buffer.from("ipfs://QmaTZvdDwnNagPwniwbmZNUE6Frd4y3cRYMju6PZ9ZKtKQ/1.json")]);

    const mintTx = await rariNFTCreator.mintNft(tokenAddress);
    const txReceipt = await mintTx.wait();
    console.log("Mint tx hash", mintTx.hash, txReceipt.logs);
    

    console.log("createNft task is not fully implemented. See TS code in comment above!");
});