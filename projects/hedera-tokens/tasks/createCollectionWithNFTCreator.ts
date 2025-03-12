import { task } from "hardhat/config";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

task("createCollectionWithNFTCreator", "Creates a non-fungible token with fix fee using the precompiled contract")
  .setAction(async (_, hre) => {
    const signers = await hre.ethers.getSigners();
    const [deployer, feeCollector] = signers;

    console.log("Using deployer address:", deployer.address);
    const contractName = "RariNFTCreator";
    const tokenCreateFactory = await hre.ethers.getContractFactory(contractName) as RariNFTCreator__factory;
    const factoryAddress = (await hre.deployments.get(contractName)).address
    const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;
    console.log(`using factory: ${factoryAddress}`);

    //Create a non fungible token with precompiled contract, all keys are set to the contract and the contract is the treasury
    const createTokenTx = await rariNFTCreator.createNft(
      "RaribleCollection",
      "SYMOL",
      "MEMO00000123478",
      1000,
      8000000,
      {
        value: "12000000000000000000", // = 12 hbars
        gasLimit: 1_000_000,
      }
    );

    
    const txReceipt = await createTokenTx.wait();
    const parsedLogs = txReceipt.logs.map(log => rariNFTCreator.interface.parseLog(log)).filter(Boolean);
    const tokenAddress = parsedLogs.filter(
      (e) => e.eventFragment.name === "CreatedToken"
    )[0].args[0];
    console.log("Token created at address", tokenAddress);

    console.log("createNft task is not fully implemented. See TS code in comment above!");
});