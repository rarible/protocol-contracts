// <ai_context> Listing utilities for creating, signing, and matching orders on ExchangeV2. Provides helpers for V3 order data encoding, sell/buy order creation, and order matching with proper TypeScript types. </ai_context>

import type { Signer } from "ethers";
import { AbiCoder } from "ethers";
import type { OrderStruct } from "./order.js";
import { ERC20, ORDER_DATA_V3 } from "./assets.js";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Encode token address and tokenId for asset data (ERC721/ERC1155)
 */
export function encBigNumber(token: string, tokenId: bigint): string {
  const tokenHex = token.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const tokenIdHex = tokenId.toString(16).padStart(64, "0");
  return `0x${tokenHex}${tokenIdHex}`;
}

/**
 * Encode ERC20 token address for asset data
 */
export function encodeERC20AssetData(tokenAddress: string): string {
  return tokenAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

/**
 * Get V3 order data type selector
 */
export function getV3Selector(): string {
  return ORDER_DATA_V3;
}

/**
 * Encode V3 order data with payouts, origin fees, and make fill flag
 */
export function encodeV3Data(
  payouts: { account: string; value: bigint }[] = [],
  originFees: { account: string; value: bigint }[] = [],
  isMakeFill: boolean = false,
): string {
  return AbiCoder.defaultAbiCoder().encode(
    ["tuple((address account, uint96 value)[] payouts, (address account, uint96 value)[] originFees, bool isMakeFill)"],
    [[payouts, originFees, isMakeFill]],
  );
}

/**
 * Create a sell order for NFT/token
 */
export function createSellOrder(
  tokenAddress: string,
  tokenId: string,
  sellerAddress: string,
  paymentAssetClass: string,
  paymentAssetData: string,
  price: string,
  assetClass: string,
): OrderStruct {
  const V3Seller = getV3Selector();
  const encodedV3 = encodeV3Data();

  return {
    maker: sellerAddress,
    makeAsset: {
      assetType: {
        assetClass,
        data: encBigNumber(tokenAddress, BigInt(tokenId)),
      },
      value: 1n,
    },
    taker: ZERO_ADDRESS,
    takeAsset: {
      assetType: {
        assetClass: paymentAssetClass,
        data: paymentAssetClass === ERC20 ? `0x${encodeERC20AssetData(paymentAssetData)}` : paymentAssetData,
      },
      value: BigInt(price),
    },
    salt: BigInt(Date.now()),
    start: 0n,
    end: 0n,
    dataType: V3Seller,
    data: encodedV3,
  };
}

/**
 * Create a buy order matching a sell order
 */
export function createBuyOrder(sellOrder: OrderStruct, buyerAddress: string, price: string): OrderStruct {
  return {
    maker: buyerAddress,
    makeAsset: {
      assetType: {
        assetClass: sellOrder.takeAsset.assetType.assetClass,
        data: sellOrder.takeAsset.assetType.data,
      },
      value: BigInt(price),
    },
    taker: sellOrder.maker,
    takeAsset: sellOrder.makeAsset,
    salt: sellOrder.salt + 1n,
    start: sellOrder.start,
    end: sellOrder.end,
    dataType: sellOrder.dataType,
    data: sellOrder.data,
  };
}

/**
 * Match orders on an exchange contract
 */
export async function matchOrderOnExchange(
  exchange: any, // ExchangeV2 or ExchangeMetaV2 type
  buyerWallet: Signer,
  sellOrder: OrderStruct,
  sellSignature: string,
  buyOrder: OrderStruct,
  buySignature: string,
  price?: string,
) {
  const tx = await exchange.connect(buyerWallet).matchOrders(sellOrder, sellSignature, buyOrder, buySignature, {
    gasLimit: 8_000_000n,
    ...(price ? { value: BigInt(price) } : {}),
  });
  await tx.wait();
  return tx;
}
