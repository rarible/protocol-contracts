import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { ExchangeMetaV2, ExchangeMetaV2__factory } from "@rarible/exchange-v2";
import { LibOrder } from "@rarible/exchange-v2/typechain-types/contracts/ExchangeV2";
import { signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { encBigNumber, ERC721, ETH, ERC20, ZERO } from "@rarible/exchange-v2/test-hardhat/utils";

function getV3Selector(): string {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("V3"));
  return ethers.utils.hexDataSlice(hash, 0, 4);
}

function encodeV3Data(): string {
  return ethers.utils.defaultAbiCoder.encode(
    ["tuple((address,uint96)[] payouts, (address,uint96)[] originFees, bool isMakeFill)"],
    [[[[], [], false]]]
  );
}

function encodeERC20AssetData(erc20Address: string): string {
  return ethers.utils.defaultAbiCoder.encode(["address"], [erc20Address]);
}

export async function listNftToken(
  exchangeAddress: string,
  sellerSigner: Signer,
  nftAddress: string,
  tokenId: BigNumber,
  price: BigNumber,
  salt?: BigNumber,
  start: number = 0,
  end: number = 0
): Promise<{ order: LibOrder.OrderStruct; signature: string }> {
  const sellerAddress = await sellerSigner.getAddress();
  const V3 = getV3Selector();
  const encodedV3 = encodeV3Data();
  const order: LibOrder.OrderStruct = {
    maker: sellerAddress,
    makeAsset: {
      assetType: {
        assetClass: ERC721,
        data: encBigNumber(nftAddress, tokenId)
      },
      value: "1"
    },
    taker: ZERO,
    takeAsset: {
      assetType: {
        assetClass: ETH,
        data: "0x"
      },
      value: price.toString()
    },
    salt: salt ? salt.toString() : Date.now().toString(),
    start: start,
    end: end,
    dataType: V3,
    data: encodedV3
  };
  const signature = await signOrderEthers(order, sellerSigner, exchangeAddress);
  return { order, signature };
}

export async function buyNftToken(
  exchangeAddress: string,
  buyerSigner: Signer,
  sellerOrder: LibOrder.OrderStruct,
  sellerSignature: string,
  price: BigNumber
): Promise<any> {
  const buyerAddress = await buyerSigner.getAddress();
  const V3 = sellerOrder.dataType;
  const buyerOrder: LibOrder.OrderStruct = {
    maker: buyerAddress,
    makeAsset: {
      assetType: {
        assetClass: ETH,
        data: "0x"
      },
      value: price.toString()
    },
    taker: sellerOrder.maker,
    takeAsset: sellerOrder.makeAsset,
    salt: (Number(sellerOrder.salt) + 1).toString(),
    start: sellerOrder.start,
    end: sellerOrder.end,
    dataType: V3,
    data: sellerOrder.data
  };
  const buyerSignature = await signOrderEthers(buyerOrder, buyerSigner, exchangeAddress);
  const exchange = ExchangeMetaV2__factory.connect(exchangeAddress, buyerSigner);
  const tx = await exchange.matchOrders(sellerOrder, sellerSignature, buyerOrder, buyerSignature, { value: price, gasLimit: 8000000 });
  return tx;
}

export async function cancelOrder(
  exchangeAddress: string,
  signer: Signer,
  order: LibOrder.OrderStruct
): Promise<any> {
  const exchange = ExchangeMetaV2__factory.connect(exchangeAddress, signer);
  const tx = await exchange.cancel(order, { gasLimit: 1000000 });
  return tx;
}

export async function listNftTokenWithERC20(
  exchangeAddress: string,
  sellerSigner: Signer,
  nftAddress: string,
  tokenId: BigNumber,
  price: BigNumber,
  erc20Address: string,
  salt?: BigNumber,
  start: number = 0,
  end: number = 0
): Promise<{ order: LibOrder.OrderStruct; signature: string }> {
  const sellerAddress = await sellerSigner.getAddress();
  const V3 = getV3Selector();
  const encodedV3 = encodeV3Data();
  const order: LibOrder.OrderStruct = {
    maker: sellerAddress,
    makeAsset: {
      assetType: {
        assetClass: ERC721,
        data: encBigNumber(nftAddress, tokenId)
      },
      value: "1"
    },
    taker: ZERO,
    takeAsset: {
      assetType: {
        assetClass: ERC20,
        data: encodeERC20AssetData(erc20Address)
      },
      value: price.toString()
    },
    salt: salt ? salt.toString() : Date.now().toString(),
    start: start,
    end: end,
    dataType: V3,
    data: encodedV3
  };
  const signature = await signOrderEthers(order, sellerSigner, exchangeAddress);
  return { order, signature };
}

export async function buyNftTokenWithERC20(
  exchangeAddress: string,
  buyerSigner: Signer,
  sellerOrder: LibOrder.OrderStruct,
  sellerSignature: string,
  price: BigNumber
): Promise<any> {
  const buyerAddress = await buyerSigner.getAddress();
  const V3 = sellerOrder.dataType;
  const buyerOrder: LibOrder.OrderStruct = {
    maker: buyerAddress,
    makeAsset: {
      assetType: {
        assetClass: ERC20,
        data: sellerOrder.takeAsset.assetType.data
      },
      value: price.toString()
    },
    taker: sellerOrder.maker,
    takeAsset: sellerOrder.makeAsset,
    salt: (Number(sellerOrder.salt) + 1).toString(),
    start: sellerOrder.start,
    end: sellerOrder.end,
    dataType: V3,
    data: sellerOrder.data
  };
  const buyerSignature = await signOrderEthers(buyerOrder, buyerSigner, exchangeAddress);
  const exchange = ExchangeMetaV2__factory.connect(exchangeAddress, buyerSigner);
  const tx = await exchange.matchOrders(sellerOrder, sellerSignature, buyerOrder, buyerSignature, { gasLimit: 8000000 });
  return tx;
}