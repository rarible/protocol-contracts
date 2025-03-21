// <ai_context>
// tasks/listBuyNft.ts
// Hardhat task to list an NFT for sale (using HBAR) and then buy it via the hederaExchange SDK
// </ai_context>

import { task } from "hardhat/config";

import { BigNumber } from "ethers";

task("listBuyNft", "List an NFT for sale and then buy it")
  .addParam("exchange", "Exchange contract address")
  .addParam("nft", "NFT contract address")
  .addParam("tokenId", "Token ID")
  .addParam("price", "Price in wei")
  .addOptionalParam("sellerIndex", "Seller signer index", "0")
  .addOptionalParam("buyerIndex", "Buyer signer index", "1")
  .setAction(async (args, hre) => {
    const { listNftToken, buyNftToken } = await import("../sdk/hederaExchange");
    const { exchange, nft, tokenId, price, sellerIndex, buyerIndex } = args;
    const signers = await hre.ethers.getSigners();
    const sellerSigner = signers[Number(sellerIndex)];
    console.log("Seller signer:", sellerSigner.address);
    const buyerSigner = signers[Number(buyerIndex)];
    console.log("Buyer signer:", buyerSigner.address);
    console.log("Listing NFT for sale...");
    const listResult = await listNftToken(exchange, sellerSigner, nft, BigNumber.from(tokenId), BigNumber.from(price));
    console.log("Order listed:");
    console.log(listResult.order);
    console.log("Seller signature:", listResult.signature);
    console.log("Buying NFT...");
    const tx = await buyNftToken(exchange, buyerSigner, listResult.order, listResult.signature, BigNumber.from(price));
    console.log("Buy transaction hash:", tx.hash);
  });