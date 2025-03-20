// <ai_context>
// sdk/createNftCollection.ts
// Exports a function that creates a new NFT collection on Hedera via RariNFTCreator
// </ai_context>

import { ethers, deployments } from "hardhat";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

export interface CreateNftCollectionParams {
  collectionName: string;
  collectionSymbol: string;
  memo: string;
  tokenType: number;
  metadataUri: string;
  feeCollector: string;
  isRoyaltyFee: boolean;
  isFixedFee: boolean;
  feeAmount: number;
  fixedFeeTokenAddress: string;
  useHbarsForPayment: boolean;
  useCurrentTokenForPayment: boolean;
  value?: string;     // default "50000000000000000000"
  gasLimit?: number;  // default 4_000_000
}

export async function createNftCollection(params: CreateNftCollectionParams): Promise<string> {
  const {
    collectionName,
    collectionSymbol,
    memo,
    tokenType,
    metadataUri,
    feeCollector,
    isRoyaltyFee,
    isFixedFee,
    feeAmount,
    fixedFeeTokenAddress,
    useHbarsForPayment,
    useCurrentTokenForPayment,
    value = "50000000000000000000",
    gasLimit = 4_000_000
  } = params;

  // Grab signer (first account is deployer by default)
  const signers = await ethers.getSigners();
  const [deployer] = signers;
  console.log("Using deployer:", deployer.address);

  // Attach to RariNFTCreator
  const contractName = "RariNFTCreator";
  const tokenCreateFactory = (await ethers.getContractFactory(
    contractName
  )) as RariNFTCreator__factory;
  const factoryAddress = (await deployments.get(contractName)).address;
  const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;

  console.log(`Using RariNFTCreator at address: ${factoryAddress}`);

  // Create collection
  const createTokenTx = await rariNFTCreator.createNonFungibleTokenWithCustomFeesPublic(
    collectionName,
    collectionSymbol,
    memo,
    tokenType,
    metadataUri,
    {
      feeCollector: feeCollector || deployer.address,
      isRoyaltyFee,
      isFixedFee,
      feeAmount,
      fixedFeeTokenAddress,
      useHbarsForPayment,
      useCurrentTokenForPayment,
    },
    {
      value,
      gasLimit,
    }
  );

  const txReceipt = await createTokenTx.wait();
  console.log("createNonFungibleToken tx hash:", createTokenTx.hash);

  // Attempt to parse the "CreatedToken" event
  const parsedLogs = txReceipt.logs.map(log => {
    try {
      return rariNFTCreator.interface.parseLog(log);
    } catch {
      return null;
    }
  }).filter(Boolean);

  const createdTokenEvent = parsedLogs.find(
    (e) => e && e.eventFragment.name === "CreatedToken"
  );
  if (!createdTokenEvent) {
    throw new Error("CreatedToken event not found in logs");
  }

  const tokenAddress = createdTokenEvent.args[0];
  console.log("Token created at address:", tokenAddress);

  return tokenAddress;
}