// <ai_context>
// tasks/listBuyWithERC20.ts
// Hardhat task to list an NFT for sale with ERC20 payment and then buy it via the hederaExchange SDK
// </ai_context>

import { task } from "hardhat/config";

import { BigNumber } from "ethers";

task("listBuyWithERC20", "List an NFT for sale with ERC20 and then buy it")
  .addParam("exchange", "Exchange contract address")
  .addParam("nft", "NFT contract address")
  .addParam("tokenId", "Token ID")
  .addParam("price", "Price in wei")
  .addParam("erc20", "ERC20 token contract address")
  .addOptionalParam("sellerIndex", "Seller signer index", "0")
  .addOptionalParam("buyerIndex", "Buyer signer index", "1")
  .setAction(async (args, hre) => {
    const { listNftTokenWithERC20, buyNftTokenWithERC20 } = await import("../sdk/hederaExchange");
    const { exchange, nft, tokenId, price, erc20, sellerIndex, buyerIndex } = args;
    const signers = await hre.ethers.getSigners();
    const sellerSigner = signers[Number(sellerIndex)];
    const buyerSigner = signers[Number(buyerIndex)];
    console.log("Listing NFT for sale with ERC20...");
    const listResult = await listNftTokenWithERC20(exchange, sellerSigner, nft, BigNumber.from(tokenId), BigNumber.from(price), erc20);
    console.log("Order listed:");
    console.log(listResult.order);
    console.log("Seller signature:", listResult.signature);
    console.log("Buying NFT with ERC20...");
    const tx = await buyNftTokenWithERC20(exchange, buyerSigner, listResult.order, listResult.signature, BigNumber.from(price));
    console.log("Buy transaction hash:", tx.hash);
  });