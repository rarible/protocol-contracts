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


    //Create a non fungible token with precompiled contract, all keys are set to the contract and the contract is the treasury
    const createTokenTx = await rariNFTCreator.createNonFungibleTokenWithCustomFeesPublic(
        "Rarible Collection With Royalties 10",
        "CAT10",
        "MEMOCAT10",
        1001,
        "ipfs://QmeSQDV3oVmrwpbBAecu5BLmCFZwd1KRkWMssFXHZBY424",
        {
            feeCollector: deployer.address,
            isRoyaltyFee: true,
            isFixedFee: false,
            feeAmount: 10,
            fixedFeeTokenAddress: '0x0000000000000000000000000000000000000000', //address for token of fixedFee, if set to 0x0, the fee will be in hbars
            useHbarsForPayment: true,
            useCurrentTokenForPayment: false,
        },
        {
            value: "50000000000000000000", // = 30 hbars
            gasLimit: 4_000_000,
        }
    ); 

    const txReceipt = await createTokenTx.wait();
    const parsedLogs = txReceipt.logs.map(log => rariNFTCreator.interface.parseLog(log)).filter(Boolean);
    const tokenAddress = parsedLogs.filter(
      (e) => e.eventFragment.name === "CreatedToken"
    )[0].args[0];
    console.log("Token created at address", tokenAddress);

});