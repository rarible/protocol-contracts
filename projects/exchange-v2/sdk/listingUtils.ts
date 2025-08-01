import { signOrderEthers } from "./signOrder";
import { encBigNumber, ERC20, ETH, ZERO } from "./utils";
import { BigNumber, Signer } from "ethers";
import { ExchangeMetaV2, ExchangeV2, } from "../typechain-types";
import type { LibOrder } from "../typechain-types/ExchangeV2";
import { encodeERC20AssetData, encodeV3Data } from "./encodeUtils";
import { getV3Selector } from "./selectorUtils";
import { TypedDataSigner } from "@ethersproject/abstract-signer";

export function createSellOrder(
    tokenAddress: string,
    tokenId: string,
    sellerAddress: string,
    paymentAssetClass: string,
    paymentAssetData: string,
    price: string,
    assetClass: string
  ) {
    const V3Seller = getV3Selector();
    const encodedV3 = encodeV3Data();
  
    return {
      maker: sellerAddress,
      makeAsset: {
        assetType: {
          assetClass,
          data: encBigNumber(tokenAddress, BigNumber.from(tokenId)),
        },
        value: "1",
      },
      taker: ZERO,
      takeAsset: {
        assetType: {
          assetClass: paymentAssetClass,
          data: paymentAssetClass === ERC20 ? encodeERC20AssetData(paymentAssetData) : paymentAssetData,
        },
        value: price.toString(),
      },
      salt: Date.now().toString(),
      start: 0,
      end: 0,
      dataType: V3Seller,
      data: encodedV3,
    };
  }

export function createBuyOrder(
    sellOrder: LibOrder.OrderStruct,
    buyerAddress: string,
    price: string
  ) {
    return {
      maker: buyerAddress,
      makeAsset: {
        assetType: {
          assetClass: sellOrder.takeAsset.assetType.assetClass,
          data: sellOrder.takeAsset.assetType.data,
        },
        value: price.toString(),
      },
      taker: sellOrder.maker,
      takeAsset: sellOrder.makeAsset,
      salt: (Number(sellOrder.salt) + 1).toString(),
      start: sellOrder.start,
      end: sellOrder.end,
      dataType: sellOrder.dataType,
      data: sellOrder.data,
    };
  }
  

export async function signOrderWithWallet(
  order: LibOrder.OrderStruct,
  wallet: Signer & TypedDataSigner,
  exchangeAddress: string
) {
  return await signOrderEthers(order, wallet, exchangeAddress);
}

export async function matchOrderOnExchange(
    exchange: ExchangeMetaV2 | ExchangeV2,
    buyerWallet: Signer & TypedDataSigner,
    sellOrder: LibOrder.OrderStruct,
    sellSignature: string,
    buyOrder: LibOrder.OrderStruct,
    buySignature: string,
    price?: string
  ) {
    const tx = await exchange.connect(buyerWallet).matchOrders(
        sellOrder,
        sellSignature,
        buyOrder,
        buySignature,
        {
          gasLimit: 8_000_000,
          ...(price ? { value: BigNumber.from(price) } : {}),
        }
      );
    await tx.wait();
  }