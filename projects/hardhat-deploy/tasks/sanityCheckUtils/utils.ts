import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { encBigNumber, ERC1155, ERC20, ERC721, ETH, ZERO } from '@rarible/exchange-v2/test-hardhat/utils';
import { BigNumber, ethers } from 'ethers';
import { ExchangeMetaV2, ExchangeV2, TestERC20 } from '../../typechain-types';

/**
 * Return 4-byte selector for "V3"
 */
export function getV3Selector(): string {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("V3"));
    return ethers.utils.hexDataSlice(hash, 0, 4);
  }
  
/**
 * Encodes V3 data for zero payouts/originFees
 */
export function encodeV3Data(): string {
  return ethers.utils.defaultAbiCoder.encode(
    [
      "tuple((address account, uint96 value)[] payouts, (address account, uint96 value)[] originFees, bool isMakeFill)"
    ],
    [
      [
        [], // payouts
        [], // originFees
        false // isMakeFill
      ]
    ]
  );
}

export const ZERO_WORD = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function getTokenAddress(factory: any, salt: string) {
  const tx = await factory['createToken(string,string,string,string,uint256)'](`SanityMintable_${salt}`, `SMNTBL_${salt}`, 'ipfs:/', 'ipfs:/', salt);
  const receipt = await tx.wait();
  const event = receipt.events?.find((event: any) => event.event === 'Create721RaribleProxy' || event.event === 'Create1155RaribleProxy');
  return event?.args?.proxy;
}

/**
 * Encodes ERC20 token address for the asset data
 */
export function encodeERC20AssetData(erc20Address: string): string {
    return ethers.utils.defaultAbiCoder.encode(["address"], [erc20Address]);
}

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

export async function listBuyWithERC20(
    
    token721: any,
    token1155: any,
    sellerWallet: any,
    buyerWallet: any,
    tokenId: string,
    price: string,
    exchange: ExchangeMetaV2 | ExchangeV2,
    erc20Contract: TestERC20
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
    console.log('Minted 1 tokens for each contract to buy with ERC20.');
  
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
            assetClass: ERC20,
            data: encodeERC20AssetData(erc20Contract.address),
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
            assetClass: ERC20,
            data: encodeERC20AssetData(erc20Contract.address),
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
              assetClass: ERC20,
              data: sellOrder.takeAsset.assetType.data,
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
              assetClass: ERC20,
              data: sellOrder1155.takeAsset.assetType.data,
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
        gasLimit: 8_000_000
      }
    );
    await tx.wait();

    const tx1155 = await exchange.connect(buyerWallet).matchOrders(
        sellOrder1155,
        sellSignature1155,
        buyerOrder1155,
        buyerSignature1155,
        {
          gasLimit: 8_000_000
        }
      );
      await tx1155.wait();
    console.log('ERC20 listing and purchases completed!\n');
  }