import { BigNumber, Wallet } from "ethers";
import { TestERC721RoyaltiesV2, TestERC721RoyaltiesV2__factory } from "@rarible/exchange-v2/typechain-types";
import { createSellOrder, createBuyOrder, signOrderWithWallet } from "@rarible/exchange-v2/sdk/listingUtils";
import { ETH, ERC721 } from "@rarible/exchange-v2/sdk/utils";
import dotenv from "dotenv";
dotenv.config();

export async function createAndTradeOrder(args: any, hre: any) {
  const { ExchangeV2 } = await import("../typechain-types");
  const { exchange, erc721, tokenid, price } = args;
  const { deployments, network } = hre;
  const provider = hre.ethers.provider;

  const PRIVATE_KEY1 = process.env.PRIVATE_KEY1;
  const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;
  if (!PRIVATE_KEY1 || !PRIVATE_KEY2) {
    throw new Error("PRIVATE_KEY1 and PRIVATE_KEY2 must be set in your .env");
  }

  // Set up seller and buyer as Wallet signers
  const seller = new Wallet(PRIVATE_KEY1, provider);
  const buyer = new Wallet(PRIVATE_KEY2, provider);

  // Get initial balances
  console.log("=== Initial Balances Get ===");
  console.log(`Wallet 1 (Seller): ${seller.address}`);
  console.log(`Wallet 2 (Buyer): ${buyer.address}`);
  const sellerInitialBalance = await hre.ethers.provider.getBalance(seller.address);
  const buyerInitialBalance = await hre.ethers.provider.getBalance(buyer.address);
  console.log("=== Initial Balances Get ===");

  console.log("=== Initial Balances ===");
  console.log(`Wallet 1 (Seller): ${hre.ethers.utils.formatEther(sellerInitialBalance)} ETH`);
  console.log(`Wallet 2 (Buyer): ${hre.ethers.utils.formatEther(buyerInitialBalance)} ETH`);
  console.log("========================");

  // Deploy or attach ERC721
  let erc721Contract: TestERC721RoyaltiesV2;
  if (!erc721) {
    const erc721Factory = new TestERC721RoyaltiesV2__factory(seller);
    erc721Contract = await erc721Factory.deploy();
    await erc721Contract.deployed();
    await erc721Contract.initialize();
    console.log(`Deployed ERC721 to ${erc721Contract.address}`);
  } else {
    erc721Contract = (await hre.ethers.getContractAt("TestERC721RoyaltiesV2", erc721, seller)) as TestERC721RoyaltiesV2;
    console.log(`Using ERC721 at ${erc721Contract.address}`);
  }

  let exchangeV2Address = exchange;
  if(!exchangeV2Address) {
    const exchangeV2 = await deployments.get("ExchangeV2");
    exchangeV2Address = exchangeV2.address;
  }

  // TokenId and price
  const _tokenId = tokenid ? BigNumber.from(tokenid) : BigNumber.from(hre.ethers.utils.randomBytes(4));
  const _price = price ? hre.ethers.utils.parseEther(price) : hre.ethers.utils.parseEther("0.1");

  // Mint NFT to seller
  await (await erc721Contract.mint(seller.address, _tokenId, [
    {
      account: seller.address,
      value: 1000
    }
  ])).wait();
  console.log(`Minted token ${_tokenId.toString()} to seller ${seller.address}`);

  // Seller approves transfer for Exchange (Exchange contract uses TransferProxy)
  // For demo, approve both exchange and transferProxy if needed. Usually TransferProxy.
  // Let's approve the exchange for simplicity (adapt if you know the actual proxy).
  await (await erc721Contract.setApprovalForAll(exchange, true)).wait();
  const transferProxy = await deployments.get("TransferProxy");
  //await (await erc721Contract.setApprovalForAll("0xa199882F70c7d3F7DCAe4abEe607C85756096fF2", true)).wait();
  await (await erc721Contract.setApprovalForAll(transferProxy.address, true)).wait();

  // Create sell order with utility function
  const sellOrder = createSellOrder(
    erc721Contract.address,
    _tokenId.toString(),
    seller.address,
    ETH,
    "0x", // ETH asset data
    _price.toString(),
    ERC721
  );

  // Sign the sell order with seller wallet (adapt signOrderWithWallet to accept Wallet)
  const sellSig = await signOrderWithWallet(sellOrder, seller, exchange);

  // Create buy order (mirror test logic)
  const buyOrder = createBuyOrder(sellOrder, buyer.address, _price.toString());
  const buySig = await signOrderWithWallet(buyOrder, buyer, exchange);

  // Print out for clarity
  console.log("Sell order:", sellOrder);
  console.log("Sell signature:", sellSig);
  console.log("Buy order:", buyOrder);
  console.log("Buy signature:", buySig);

  // Attach to ExchangeV2 as buyer
  const exchangeV2 = (await hre.ethers.getContractAt("ExchangeV2", exchangeV2Address, buyer)) as typeof ExchangeV2;

  // Execute order (as buyer), send ETH for order value
  const tx = await exchangeV2.matchOrders(
    sellOrder,
    sellSig,
    buyOrder,
    buySig,
    { value: _price }
  );
  const receipt = await tx.wait();
  console.log("Trade executed! TX hash:", receipt.transactionHash);

  // Confirm NFT ownership
  const newOwner = await erc721Contract.ownerOf(_tokenId);
  if (newOwner.toLowerCase() === buyer.address.toLowerCase()) {
    console.log(`✅ Success: Buyer ${buyer.address} now owns token ${_tokenId.toString()}`);
  } else {
    console.error(`❌ Error: Buyer does NOT own the token. Current owner: ${newOwner}`);
  }
} 