// <ai_context>
// tasks/createCollection.ts
// Hardhat task that uses the createNftCollection function from our sdk
// with dynamic arguments
// </ai_context>

import { task } from "hardhat/config";

task("createCollection", "Creates a new Hedera NFT collection via RariNFTCreator")
  .addParam("collectionName", "Name of the NFT collection")
  .addParam("collectionSymbol", "Symbol for the NFT collection")
  .addParam("memo", "Memo field for the NFT collection")
  .addParam("tokenType", "Numeric token type (e.g. 1001)")
  .addParam("metadataUri", "Metadata URI (ipfs://...)")
  .addOptionalParam("feeCollector", "Fee collector address")
  .addOptionalParam("isRoyaltyFee", "true/false if we want royalties", "false")
  .addOptionalParam("isFixedFee", "true/false if we want a fixed fee", "false")
  .addOptionalParam("feeAmount", "Numeric fee amount", "0")
  .addOptionalParam("fixedFeeTokenAddress", "Fixed fee token address", "0x0000000000000000000000000000000000000000")
  .addOptionalParam("useHbarsForPayment", "true/false if we pay in HBARs", "true")
  .addOptionalParam("useCurrentTokenForPayment", "true/false if we pay in current token", "false")
  .addOptionalParam("value", "Amount in Wei-like units for creation, default 50 HBAR", "50000000000000000000")
  .addOptionalParam("gasLimit", "Gas limit, default 4000000", "4000000")
  .setAction(async (args, hre) => {
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
      value,
      gasLimit
    } = args;

    const { createNftCollection } = await import("../sdk");
    const tokenAddress = await createNftCollection({
      collectionName,
      collectionSymbol,
      memo,
      tokenType: parseInt(tokenType),
      metadataUri,
      feeCollector: feeCollector || "",
      isRoyaltyFee: (isRoyaltyFee === "true"),
      isFixedFee: (isFixedFee === "true"),
      feeAmount: parseInt(feeAmount),
      fixedFeeTokenAddress,
      useHbarsForPayment: (useHbarsForPayment === "true"),
      useCurrentTokenForPayment: (useCurrentTokenForPayment === "true"),
      value,
      gasLimit: parseInt(gasLimit),
    });

    console.log("SDK => collection created at:", tokenAddress);
  });