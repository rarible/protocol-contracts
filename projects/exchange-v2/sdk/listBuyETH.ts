import { signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { encBigNumber, ERC1155, ERC20, ERC721, ETH, ZERO } from '@rarible/exchange-v2/test-hardhat/utils';
import { BigNumber } from 'ethers';
import { ExchangeMetaV2, ExchangeV2 } from '../typechain-types';
import { encodeV3Data } from './encodeUtils';
import { getV3Selector } from './selectorUtils';

export const ZERO_WORD = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function listBuyWithEth(
  token721: any,
  token1155: any,
  sellerWallet: any,
  buyerWallet: any,
  tokenId: string,
  price: string,
  exchange: ExchangeMetaV2 | ExchangeV2
) {
  const sellerAddress = sellerWallet.address;
  const mint721Data = {
    tokenId,
    tokenURI: 'ipfs:/',
    creators: [{ account: sellerAddress, value: 10000 }],
    royalties: [],
    signatures: [ZERO_WORD],
  }
  await token721.mintAndTransfer(mint721Data, sellerAddress);
  const mint1155Data = {
    ...mint721Data,
    supply: 1
  }
  await token1155.mintAndTransfer(mint1155Data, sellerAddress, 1);
  console.log('Minted 1 tokens from each contract to buy with ETH.');

  // STEP 3: CREATE SELL ORDER
  const V3Seller = getV3Selector();
  const encodedV3 = encodeV3Data();

  const sellOrder = {
      maker: sellerAddress,
      makeAsset: {
      assetType: {
          assetClass: ERC721,
          data: encBigNumber(token721.address, BigNumber.from(tokenId)),
      },
      value: "1",
      },
      taker: ZERO,
      takeAsset: {
        assetType: {
            assetClass: ETH,
            data: "0x",
        },
        value: price.toString(),
      },
      salt: Date.now().toString(),
      start: 0,
      end: 0,
      dataType: V3Seller,
      data: encodedV3,
  };

  const sellOrder1155 = {
    maker: sellerAddress,
    makeAsset: {
    assetType: {
        assetClass: ERC1155,
        data: encBigNumber(token1155.address, BigNumber.from(tokenId)),
    },
    value: "1",
    },
    taker: ZERO,
    takeAsset: {
      assetType: {
          assetClass: ETH,
          data: "0x",
      },
      value: price.toString(),
    },
    salt: Date.now().toString(),
    start: 0,
    end: 0,
    dataType: V3Seller,
    data: encodedV3,
};

  const sellSignature = await signOrderEthers(sellOrder, sellerWallet, exchange.address);
  const sellSignature1155 = await signOrderEthers(sellOrder1155, sellerWallet, exchange.address);
  // STEP 4: BUYER EXECUTES PURCHASE
  // Buyer executes purchase
  const buyerAddress = buyerWallet.address;
  const V3Buyer = sellOrder.dataType;

  const buyerOrder = {
      maker: buyerAddress,
      makeAsset: {
        assetType: {
            assetClass: ETH,
            data: "0x",
        },
        value: price.toString(),
      },
      taker: sellOrder.maker,
      takeAsset: sellOrder.makeAsset,
      salt: (Number(sellOrder.salt) + 1).toString(),
      start: sellOrder.start,
      end: sellOrder.end,
      dataType: V3Buyer,
      data: sellOrder.data,
  };

  const buyerOrder1155 = {
    maker: buyerAddress,
    makeAsset: {
      assetType: {
          assetClass: ETH,
          data: "0x",
      },
      value: price.toString(),
    },
    taker: sellOrder1155.maker,
    takeAsset: sellOrder1155.makeAsset,
    salt: (Number(sellOrder1155.salt) + 1).toString(),
    start: sellOrder1155.start,
    end: sellOrder1155.end,
    dataType: V3Buyer,
    data: sellOrder1155.data,
};

  const buyerSignature = await signOrderEthers(buyerOrder, buyerWallet, exchange.address);
  const buyerSignature1155 = await signOrderEthers(buyerOrder1155, buyerWallet, exchange.address);

  const tx = await exchange.connect(buyerWallet).matchOrders(
    sellOrder,
    sellSignature,
    buyerOrder,
    buyerSignature,
    {
      value: BigNumber.from(price)
    }
  );
  const tx1155 = await exchange.connect(buyerWallet).matchOrders(
    sellOrder1155,
    sellSignature1155,
    buyerOrder1155,
    buyerSignature1155,
    {
      value: BigNumber.from(price)
    }
  );
  await tx.wait();
  await tx1155.wait();
  console.log('ETH listing and purchases completed!\n');
}