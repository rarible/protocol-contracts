// ExchangeV2 acceptance test with ERC2981 royalties for Hardhat 3 + Ethers 6
// Tests deployed contracts on Sepolia testnet

import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const connection = await network.connect();
const { ethers } = connection;

// Import types from typechain
import type {
  RoyaltiesRegistryPermissioned,
  RoyaltiesRegistry,
  TestERC721WithRoyaltyV2981,
  ExchangeV2,
  TransferProxy,
} from "../types/ethers-contracts/index.js";

import {
  RoyaltiesRegistryPermissioned__factory,
  RoyaltiesRegistry__factory,
  TestERC721WithRoyaltyV2981__factory,
  ExchangeV2__factory,
  TransferProxy__factory,
} from "../types/ethers-contracts/index.js";

// Import common-sdk helpers
import { Order, Asset, sign, type OrderStruct } from "@rarible/common-sdk/src/order";
import { ETH, ERC721, enc, ORDER_DATA_V3 } from "@rarible/common-sdk/src/assets";

// Get paths for deployment files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const deploymentsDir = join(__dirname, "..", "deployments", "sepolia");

// Helper to read deployment JSON files
function getDeployment(name: string): { address: string; abi: any[] } {
  const filePath = join(deploymentsDir, `${name}.json`);
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Constants
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Helper to build token ID from receiver address and offset (for 2981 royalties)
function buildTokenId(receiver: string, offset: bigint): bigint {
  return (BigInt(receiver) << 96n) + offset;
}

// Helper to encode V3 data (matches LibOrderDataV3.DataV3 struct in Solidity)
// DataV3 { Part[] payouts, Part[] originFees, bool isMakeFill }
// where Part is { address account, uint96 value }
function encodeV3Data(isMakeFill: boolean = true): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(tuple(address,uint96)[],tuple(address,uint96)[],bool)"],
    [[[], [], isMakeFill]],
  );
}

describe("ExchangeV2 with ERC2981 Royalties (Hardhat 3 + Ethers 6)", function () {
  // Increase timeout for testnet operations
  this.timeout(120000);

  let registry: RoyaltiesRegistryPermissioned;
  let oldRegistry: RoyaltiesRegistry;
  let transferProxy: TransferProxy;
  let exchange: ExchangeV2;
  let erc721: TestERC721WithRoyaltyV2981;

  let owner: ethersTypes.Signer;
  let seller: ethersTypes.Wallet;
  let buyer: ethersTypes.Wallet;
  let whitelister: ethersTypes.Wallet;
  let royaltyRecipient: ethersTypes.Wallet;

  let tokenId: string;
  const price = ethers.parseEther("0.01");
  const numberOfBlocksToWait = 1;

  let protocolFeeBpsBuyerAmount = 0n;
  let protocolFeeBpsSellerAmount = 0n;

  // Nonce management
  let sellerCurrentNonce: number;
  let buyerCurrentNonce: number;

  async function getAndIncrementSellerNonce(): Promise<number> {
    return sellerCurrentNonce++;
  }

  async function getAndIncrementBuyerNonce(): Promise<number> {
    return buyerCurrentNonce++;
  }

  // Sign order using common-sdk
  async function signOrder(order: OrderStruct, signer: ethersTypes.Signer): Promise<string> {
    return sign(signer, order, await exchange.getAddress());
  }

  before(async function () {
    [owner] = await ethers.getSigners();

    const PRIVATE_KEY1 = process.env.PRIVATE_KEY1;
    const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;
    const PRIVATE_KEY_ROYALTY = process.env.PRIVATE_KEY_ROYALTY;

    if (!PRIVATE_KEY1 || !PRIVATE_KEY2 || !PRIVATE_KEY_ROYALTY) {
      throw new Error("PRIVATE_KEY1, PRIVATE_KEY2, and PRIVATE_KEY_ROYALTY must be set in .env");
    }

    // Create wallet signers
    seller = new ethers.Wallet(PRIVATE_KEY1, ethers.provider);
    buyer = new ethers.Wallet(PRIVATE_KEY2, ethers.provider);
    whitelister = new ethers.Wallet(PRIVATE_KEY1, ethers.provider);
    royaltyRecipient = new ethers.Wallet(PRIVATE_KEY_ROYALTY, ethers.provider);

    console.log("=== Test Setup ===");
    console.log("Seller:", seller.address);
    console.log("Buyer:", buyer.address);
    console.log("Royalty Recipient:", royaltyRecipient.address);

    // Get deployed contract addresses from JSON files
    const registryDeployment = getDeployment("RoyaltiesRegistry");
    const transferProxyDeployment = getDeployment("TransferProxy");
    const exchangeDeployment = getDeployment("ExchangeV2");

    console.log("Registry address:", registryDeployment.address);
    console.log("TransferProxy address:", transferProxyDeployment.address);
    console.log("Exchange address:", exchangeDeployment.address);

    // Connect to deployed contracts using typechain factories
    registry = RoyaltiesRegistryPermissioned__factory.connect(registryDeployment.address, owner);
    oldRegistry = RoyaltiesRegistry__factory.connect(registryDeployment.address, owner);
    transferProxy = TransferProxy__factory.connect(transferProxyDeployment.address, owner);
    exchange = ExchangeV2__factory.connect(exchangeDeployment.address, owner);

    console.log("Owner balance:", ethers.formatEther(await ethers.provider.getBalance(await owner.getAddress())));
    console.log("Seller balance:", ethers.formatEther(await ethers.provider.getBalance(seller.address)));
    console.log("Buyer balance:", ethers.formatEther(await ethers.provider.getBalance(buyer.address)));

    // Fetch initial nonces
    sellerCurrentNonce = await ethers.provider.getTransactionCount(seller.address, "pending");
    buyerCurrentNonce = await ethers.provider.getTransactionCount(buyer.address, "pending");

    // Deploy test ERC721 with royalties
    console.log("Deploying TestERC721WithRoyaltyV2981...");
    const gasPrice = (await ethers.provider.getFeeData()).gasPrice! * 2n;

    erc721 = await new TestERC721WithRoyaltyV2981__factory(seller).deploy({
      nonce: await getAndIncrementSellerNonce(),
      gasPrice,
    });
    await erc721.waitForDeployment();
    console.log("TestERC721WithRoyaltyV2981 deployed at:", await erc721.getAddress());

    // Initialize
    const initTx = await erc721.connect(seller).initialize("TestERC721WithRoyaltyV2981", "TEST", "https://test.com", {
      nonce: await getAndIncrementSellerNonce(),
      gasPrice,
    });
    await initTx.wait(numberOfBlocksToWait);

    // Whitelist in RoyaltiesRegistry
    try {
      const whitelistTx = await registry.connect(whitelister).setRoyaltiesAllowed(await erc721.getAddress(), true, {
        nonce: await getAndIncrementSellerNonce(),
        gasPrice,
      });
      await whitelistTx.wait(numberOfBlocksToWait);
      console.log("Token whitelisted in RoyaltiesRegistry");
    } catch (e) {
      console.log("Whitelisting skipped (may not be permissioned registry)");
    }

    // Get protocol fees
    const [, buyerFee, sellerFee] = await exchange.protocolFee();
    protocolFeeBpsBuyerAmount = buyerFee;
    protocolFeeBpsSellerAmount = sellerFee;
    console.log("Protocol Fee Buyer:", protocolFeeBpsBuyerAmount.toString(), "bps");
    console.log("Protocol Fee Seller:", protocolFeeBpsSellerAmount.toString(), "bps");
  });

  describe("getRoyalties Scenarios - Allowed", function () {
    it("ERC721 with royalties V2981 interface: returns the set royalties", async function () {
      // Reset nonces
      sellerCurrentNonce = await ethers.provider.getTransactionCount(seller.address, "pending");
      buyerCurrentNonce = await ethers.provider.getTransactionCount(buyer.address, "pending");
      const gasPrice = (await ethers.provider.getFeeData()).gasPrice! * 2n;

      // Build token ID with royalty recipient encoded
      tokenId = buildTokenId(royaltyRecipient.address, 1n).toString();
      console.log("Token ID:", tokenId);

      // Mint token to seller
      const mintTx = await erc721.connect(seller).mint(seller.address, tokenId, {
        nonce: await getAndIncrementSellerNonce(),
        gasPrice,
      });
      await mintTx.wait(numberOfBlocksToWait);

      // Verify royalties
      const result = await registry.getRoyalties.staticCall(await erc721.getAddress(), tokenId);
      const resultOld = await oldRegistry.getRoyalties.staticCall(await erc721.getAddress(), tokenId);
      const oldType = await oldRegistry.getRoyaltiesType.staticCall(await erc721.getAddress());
      const type = await registry.getRoyaltiesType.staticCall(await erc721.getAddress());

      console.log("Old type:", oldType.toString());
      console.log("Type:", type.toString());
      console.log("Result old:", JSON.stringify(resultOld, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
      console.log("Result:", JSON.stringify(result, (_, v) => (typeof v === "bigint" ? v.toString() : v)));

      expect(oldType).to.equal(type, "Types should be the same");
      expect(resultOld.length).to.equal(result.length, "Results should be the same");
      expect(resultOld[0].account).to.equal(result[0].account, "Recipients should be the same");
      expect(resultOld[0].value).to.equal(result[0].value, "Values should be the same");
      expect(result.length).to.equal(1, "Should return one royalty when allowed");

      // Approve TransferProxy
      const approveTx = await erc721.connect(seller).approve(await transferProxy.getAddress(), tokenId, {
        nonce: await getAndIncrementSellerNonce(),
        gasPrice,
      });
      await approveTx.wait(numberOfBlocksToWait);
      console.log("TransferProxy approved");
    });
  });

  describe("should trade with royalties", function () {
    it("should trade with royalties", async function () {
      // Reset nonces
      sellerCurrentNonce = await ethers.provider.getTransactionCount(seller.address, "pending");
      buyerCurrentNonce = await ethers.provider.getTransactionCount(buyer.address, "pending");
      const gasPrice = (await ethers.provider.getFeeData()).gasPrice! * 2n;

      // Snapshot balances before trade
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      const royaltyRecipientBalanceBefore = await ethers.provider.getBalance(royaltyRecipient.address);

      console.log("=== Balances Before Trade ===");
      console.log("Seller:", ethers.formatEther(sellerBalanceBefore));
      console.log("Buyer:", ethers.formatEther(buyerBalanceBefore));
      console.log("Royalty Recipient:", ethers.formatEther(royaltyRecipientBalanceBefore));

      // Create sell order using common-sdk
      const erc721Address = await erc721.getAddress();
      const sellOrder = Order(
        seller.address,
        Asset(ERC721, enc(erc721Address, BigInt(tokenId)), 1n),
        ZERO_ADDRESS,
        Asset(ETH, "0x", price),
        BigInt(Date.now()),
        0n,
        0n,
        ORDER_DATA_V3,
        encodeV3Data(),
      );

      // Sign the sell order
      console.log("Signing sell order...");
      const sellSig = await signOrder(sellOrder, seller);

      // Create buy order (mirror of sell order)
      console.log("Creating buy order...");
      const buyOrder = Order(
        buyer.address,
        Asset(ETH, "0x", price),
        seller.address,
        Asset(ERC721, enc(erc721Address, BigInt(tokenId)), 1n),
        BigInt(Date.now()) + 1n,
        0n,
        0n,
        ORDER_DATA_V3,
        encodeV3Data(),
      );

      // Sign buy order
      console.log("Signing buy order...");
      const buySig = await signOrder(buyOrder, buyer);

      console.log(
        "Sell order:",
        JSON.stringify(sellOrder, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
      );
      console.log(
        "Buy order:",
        JSON.stringify(buyOrder, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
      );

      // Execute order
      console.log("Executing matchOrders...");
      const tx = await exchange.connect(buyer).matchOrders(sellOrder, sellSig, buyOrder, buySig, {
        value: price,
        nonce: await getAndIncrementBuyerNonce(),
        gasPrice,
      });

      const receipt = await tx.wait(numberOfBlocksToWait);
      console.log("Trade executed! TX hash:", receipt?.hash);

      // Confirm NFT ownership
      const newOwner = await erc721.ownerOf(tokenId);
      expect(newOwner.toLowerCase()).to.equal(buyer.address.toLowerCase());
      console.log("NFT transferred to buyer!");

      // Check balances after trade
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const royaltyRecipientBalanceAfter = await ethers.provider.getBalance(royaltyRecipient.address);

      console.log("=== Balances After Trade ===");
      console.log("Seller:", ethers.formatEther(sellerBalanceAfter));
      console.log("Buyer:", ethers.formatEther(buyerBalanceAfter));
      console.log("Royalty Recipient:", ethers.formatEther(royaltyRecipientBalanceAfter));

      // Calculate expected values
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const [, royaltyAmount] = await erc721.royaltyInfo(tokenId, price);
      const feeSellerAmount = (price * protocolFeeBpsSellerAmount) / 10000n;
      const feeBuyerAmount = (price * protocolFeeBpsBuyerAmount) / 10000n;

      console.log("=== Calculations ===");
      console.log("Price:", ethers.formatEther(price));
      console.log("Gas cost:", ethers.formatEther(gasCost));
      console.log("Royalty amount:", ethers.formatEther(royaltyAmount));
      console.log("Seller fee:", ethers.formatEther(feeSellerAmount));

      // Verify balance changes
      const expectedSellerReceived = price - feeSellerAmount - royaltyAmount;
      const tolerance = ethers.parseEther("0.000001");

      expect(sellerBalanceAfter - sellerBalanceBefore).to.be.closeTo(
        expectedSellerReceived,
        tolerance,
        "Seller should receive price minus fees and royalties",
      );

      expect(royaltyRecipientBalanceAfter - royaltyRecipientBalanceBefore).to.equal(
        royaltyAmount,
        "Royalty must be received",
      );

      console.log("=== Trade completed successfully! ===");
    });
  });
});
