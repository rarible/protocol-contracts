import { ethers } from "hardhat";
import { keccak256 } from "ethereumjs-util";
import Web3 from "web3";

const web3 = new Web3();

function id(str: string): string {
  return `0x${keccak256(Buffer.from(str)).toString("hex").substring(0, 8)}`;
}

function enc(token: string, tokenId?: string): string {
  if (tokenId) {
    return web3.eth.abi.encodeParameters(["address", "uint256"], [token, tokenId]);
  } else {
    return web3.eth.abi.encodeParameter("address", token);
  }
}

const ETH = id("ETH");
const ERC20 = id("ERC20");
const ERC721 = id("ERC721");
const ERC721_LAZY = id("ERC721_LAZY");
const ERC1155 = id("ERC1155");
const ERC1155_LAZY = id("ERC1155_LAZY");
const COLLECTION = id("COLLECTION");
const CRYPTO_PUNKS = id("CRYPTO_PUNKS");
const ORDER_DATA_V1 = id("V1");
const ORDER_DATA_V2 = id("V2");
const ORDER_DATA_V3_BUY = id("V3_BUY");
const ORDER_DATA_V3_SELL = id("V3_SELL");
const TO_MAKER = id("TO_MAKER");
const TO_TAKER = id("TO_TAKER");
const PROTOCOL = id("PROTOCOL");
const ROYALTY = id("ROYALTY");
const ORIGIN = id("ORIGIN");
const PAYOUT = id("PAYOUT");
const LOCK = id("LOCK");
const UNLOCK = id("UNLOCK");
const TO_LOCK = id("TO_LOCK");

export { id, enc, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_SELL, ORDER_DATA_V3_BUY, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, LOCK, UNLOCK, TO_LOCK };
