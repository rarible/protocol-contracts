import { task } from "hardhat/config";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

task("createNftCollectionWithRoalties", "Creates a non-fungible token with fix fee and royalties using the precompiled contract")
  .setAction(async (_, hre) => {
    const signers = await hre.ethers.getSigners();
    const [deployer, feeCollector] = signers;

    console.log("Using deployer address:", deployer.address);
    const contractName = "RariNFTCreator";
    const tokenCreateFactory = await hre.ethers.getContractFactory(contractName) as RariNFTCreator__factory;
    const factoryAddress = (await hre.deployments.get(contractName)).address
    const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;
    console.log(`using factory: ${factoryAddress}`);

    const royaltyParams = {
      isRoyaltyFee: false,
      isMultipleRoyaltyFee: false,
      feeAmount: 10,
      fixedFeeTokenAddress: "0x0000000000000000000000000000000000000000",
      useHbarsForPayment: false,
      feeCollector: deployer.address,
      secondfeeAmount: 0,
      secondFixedFeeTokenAddress: "0x0000000000000000000000000000000000000000",
      useHbarsForPaymentSecondFixFee: false,
      useCurrentTokenForPaymentSecondFixFee: false,
      feeCollector2: feeCollector.address,
    }

    const fixFeeParams = {
      isFractionalFee: false,
      isFixedFee: false,
      useCurrentTokenForPayment: false,
      isMultipleFixedFee: false,
      feeAmount: 0,
      fixedFeeTokenAddress: "0x0000000000000000000000000000000000000000",
      useHbarsForPayment: false,
      feeCollector: deployer.address,
      secondfeeAmount: 0,
      secondFixedFeeTokenAddress: "0x0000000000000000000000000000000000000000",
      useHbarsForPaymentSecondFixFee: false,
      useCurrentTokenForPaymentSecondFixFee: false,
      feeCollector2: feeCollector.address,
    }

    //Create a non fungible token with precompiled contract, all keys are set to the contract and the contract is the treasury
    const createTokenTx = await rariNFTCreator.createNftCollectionWithFeesAndRoyalty(
      "RaribleCollectionWithRoyalties",
      "CAT",
      "MEMOCAT01",
      1000,
      8000000,
      fixFeeParams,
      royaltyParams,
      {
        value: "100000000000000000000", // = 100 hbars
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