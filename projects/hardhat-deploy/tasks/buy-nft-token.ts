// import { task } from "hardhat/config";
// import dotenv from "dotenv";
// import { Wallet, BigNumber } from "ethers";
// import axios from "axios";
// import { ExchangeV2 } from "../typechain-types";
// import { createBuyOrder, signOrderWithWallet } from "@rarible/exchange-v2/sdk/listingUtils";
// import { ETH, ERC721 } from "@rarible/exchange-v2/sdk/utils";
// import { getV3Selector } from "@rarible/exchange-v2/sdk/selectorUtils";

// dotenv.config();

// task("fill-order-by-id", "Fetches an order by ID from Rarible API and fills it")
//   .addParam("orderId", "Order ID to fetch and fill (e.g., RARI:0x...)")
//   .addParam("exchange", "ExchangeV2 contract address")
//   .setAction(async (args, hre) => {
//     const { orderId, exchange } = args;
//     const { ethers, deployments, network } = hre;
//     const provider = ethers.provider;

//     const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;
//     if (!PRIVATE_KEY2) {
//       throw new Error("PRIVATE_KEY2 must be set in your .env");
//     }

//     // Set up buyer as Wallet signer
//     const buyer = new Wallet(PRIVATE_KEY2, provider);

//     // Get buyer's initial balance
//     console.log("=== Initial Balance ===");
//     console.log(`Buyer: ${buyer.address}`);
//     const buyerInitialBalance = await provider.getBalance(buyer.address);
//     console.log(`Buyer Balance: ${ethers.utils.formatEther(buyerInitialBalance)} ETH`);
//     console.log("======================");

//     // Fetch order from Rarible API
//     const apiUrl = `https://api.rarible.org/v0.1/orders/${orderId}`;
//     let orderResponse;
//     try {
//       const response = await axios.get(apiUrl);
//       orderResponse = response.data;
//     } catch (error) {
//       throw new Error(`Failed to fetch order: ${error instanceof Error ? error.message : String(error)}`);
//     }

//     // Validate order
//     if (orderResponse.status !== "ACTIVE" || orderResponse.cancelled) {
//       throw new Error("Order is not active or has been cancelled");
//     }
//     if (orderResponse.make.type["@type"] !== "ERC721" || orderResponse.take.type["@type"] !== "ETH") {
//       throw new Error("Order must be ERC721 for ETH");
//     }

//     // Extract order details
//     const erc721ContractAddress = orderResponse.make.type.contract.split(":")[1];
//     const tokenId = BigNumber.from(orderResponse.make.type.tokenId);
//     const price = ethers.utils.parseEther(orderResponse.makePrice);
//     const seller = orderResponse.maker.split(":")[1];
//     const signature = orderResponse.signature;

//     console.log(`Fetched order: ${orderId}`);
//     console.log(`Seller: ${seller}`);
//     console.log(`ERC721: ${erc721ContractAddress}`);
//     console.log(`Token ID: ${tokenId.toString()}`);
//     console.log(`Price: ${ethers.utils.formatEther(price)} ETH`);

//     const V3Seller = getV3Selector();
//     // Construct sell order from API response
//     const sellOrder = {
//       maker: seller,
//       make: {
//         assetType: {
//           assetClass: ERC721,
//           contract: erc721ContractAddress,
//           tokenId: tokenId.toString(),
//         },
//         value: orderResponse.make.value,
//       },
//       take: {
//         assetType: {
//           assetClass: ETH,
//           data: "0x",
//         },
//         value: price.toString(),
//       },
//       salt: orderResponse.salt,
//       type: V3Seller,
//       data: orderResponse.data,
//     };

//     // Create buy order
//     const buyOrder = createBuyOrder(sellOrder, buyer.address, price.toString());
//     const buySig = await signOrderWithWallet(buyOrder, buyer, exchange);

//     // Attach to ExchangeV2 as buyer
//     const exchangeV2 = (await ethers.getContractAt("ExchangeV2", exchange, buyer)) as ExchangeV2;

//     // Execute order (as buyer), send ETH for order value
//     const tx = await exchangeV2.matchOrders(
//       sellOrder,
//       signature,
//       buyOrder,
//       buySig,
//       { value: price }
//     );
//     const receipt = await tx.wait();
//     console.log("Trade executed! TX hash:", receipt.transactionHash);

//     // Confirm NFT ownership
//     const erc721Contract = await ethers.getContractAt("TestERC721RoyaltiesV2", erc721ContractAddress, buyer);
//     const newOwner = await erc721Contract.ownerOf(tokenId);
//     if (newOwner.toLowerCase() === buyer.address.toLowerCase()) {
//       console.log(`✅ Success: Buyer ${buyer.address} now owns token ${tokenId.toString()}`);
//     } else {
//       console.error(`❌ Error: Buyer does NOT own the token. Current owner: ${newOwner}`);
//     }

//     // Log final balance
//     const buyerFinalBalance = await provider.getBalance(buyer.address);
//     console.log("=== Final Balance ===");
//     console.log(`Buyer Balance: ${ethers.utils.formatEther(buyerFinalBalance)} ETH`);
//     console.log("=====================");
//   });