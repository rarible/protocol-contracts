import { signOrderEthers } from "./signOrder";
import { encBigNumber, ERC20, ETH, ZERO } from "./utils";
import { BigNumber } from "ethers";
import { ExchangeMetaV2, ExchangeV2 } from "../typechain-types";
import { encodeERC20AssetData, encodeV3Data } from "./encodeUtils";
import { getV3Selector } from "./selectorUtils";
import { ZERO_WORD } from "./constants";

export async function mintToken(
  tokenContract: any,
  tokenId: string,
  sellerAddress: string,
  options?: {
    is1155?: boolean;
    supply?: number;
  }
) {
  const is1155 = options?.is1155 ?? false;
  const supply = options?.supply ?? 1;

  const mintData: any = {
    tokenId,
    tokenURI: "ipfs:/",
    creators: [{ account: sellerAddress, value: 10000 }],
    royalties: [],
    signatures: [ZERO_WORD],
  };

  if (is1155) {
    mintData.supply = supply;
    await tokenContract.mintAndTransfer(mintData, sellerAddress, supply);
  } else {
    await tokenContract.mintAndTransfer(mintData, sellerAddress);
  }
}


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
    sellOrder: any,
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
  order: any,
  wallet: any,
  exchangeAddress: string
) {
  return await signOrderEthers(order, wallet, exchangeAddress);
}

export async function matchOrderOnExchange(
    exchange: ExchangeMetaV2 | ExchangeV2,
    buyerWallet: any,
    sellOrder: any,
    sellSignature: any,
    buyOrder: any,
    buySignature: any,
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