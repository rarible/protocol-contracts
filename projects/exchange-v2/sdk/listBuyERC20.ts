import { ERC1155, ERC20, ERC721 } from "./utils";
import { ExchangeMetaV2, ExchangeV2 } from "../typechain-types";
import { IERC20Upgradeable } from "@rarible/tokens/js";
import {
  mintERC721,
  mintERC1155,
  createSellOrder,
  createBuyOrder,
  signOrderWithWallet,
  matchOrderOnExchange,
} from "./listingUtils";

export async function listBuyWithERC20(
  token721: any,
  token1155: any,
  sellerWallet: any,
  buyerWallet: any,
  tokenId: string,
  price: string,
  exchange: ExchangeMetaV2 | ExchangeV2,
  erc20Contract: IERC20Upgradeable
) {
  const sellerAddress = sellerWallet.address;
  const buyerAddress = buyerWallet.address;

  await mintERC721(token721, tokenId, sellerAddress);
  await mintERC1155(token1155, tokenId, sellerAddress);

  const sellOrder721 = createSellOrder(
    token721.address,
    tokenId,
    sellerAddress,
    ERC20,
    erc20Contract.address,
    price,
    ERC721
  );

  const sellOrder1155 = createSellOrder(
    token1155.address,
    tokenId,
    sellerAddress,
    ERC20,
    erc20Contract.address,
    price,
    ERC1155
  );

  const sellSignature721 = await signOrderWithWallet(sellOrder721, sellerWallet, exchange.address);
  const sellSignature1155 = await signOrderWithWallet(sellOrder1155, sellerWallet, exchange.address);

  const buyOrder721 = createBuyOrder(sellOrder721, buyerAddress, price);
  const buyOrder1155 = createBuyOrder(sellOrder1155, buyerAddress, price);

  const buyerSignature721 = await signOrderWithWallet(buyOrder721, buyerWallet, exchange.address);
  const buyerSignature1155 = await signOrderWithWallet(buyOrder1155, buyerWallet, exchange.address);

  await matchOrderOnExchange(exchange, buyerWallet, sellOrder721, sellSignature721, buyOrder721, buyerSignature721);
  await matchOrderOnExchange(exchange, buyerWallet, sellOrder1155, sellSignature1155, buyOrder1155, buyerSignature1155);

  console.log("ERC20 listing and purchases completed!\n");
}
