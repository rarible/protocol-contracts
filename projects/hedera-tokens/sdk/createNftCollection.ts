// <ai_context>
// sdk/createNftCollection.ts
// Exports a function that creates a new NFT collection on Hedera via RariNFTCreator
// Updated to remove direct Hardhat references and accept external signer/contract address
// </ai_context>

import { Signer } from "ethers";
import { RariNFTCreator__factory } from "../typechain-types";

export interface CreateNftCollectionParams {
  collectionName: string;
  collectionSymbol: string;
  memo: string;
  maxSupply: number;
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

export async function createNftCollection(
  signer: Signer,
  rariNFTCreatorAddress: string,
  params: CreateNftCollectionParams
): Promise<string> {
  const {
    collectionName,
    collectionSymbol,
    memo,
    maxSupply,
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

  const rariNFTCreator = RariNFTCreator__factory.connect(rariNFTCreatorAddress, signer);

  const createTokenTx = await rariNFTCreator.createNonFungibleTokenWithCustomFeesPublic(
    collectionName,
    collectionSymbol,
    memo,
    maxSupply,
    metadataUri,
    {
      feeCollector,
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

  // Attempt to parse the "CreatedToken" event
  const parsedLogs = txReceipt.logs
    .map((log) => {
      try {
        return rariNFTCreator.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const createdTokenEvent = parsedLogs.find(
    (e) => e && e.eventFragment.name === "CreatedToken"
  );
  if (!createdTokenEvent) {
    throw new Error("CreatedToken event not found in logs");
  }

  const tokenAddress = createdTokenEvent.args[0];
  return tokenAddress;
}