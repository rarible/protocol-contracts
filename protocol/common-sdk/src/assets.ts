// <ai_context> TypeScript port of scripts/assets.js. Provides asset class identifiers and simple ABI encoding helpers using pure TypeScript/BigInt for use in tests and SDKs without relying on web3.</ai_context>

import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Compute 4-byte asset class id as in Solidity: bytes4(keccak256(str)).
 */
export function id(str: string): string {
  return keccak256(toUtf8Bytes(str)).slice(0, 10);
}

function encodeAddress(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, "");
  if (hex.length !== 40) {
    throw new Error(`Invalid address length for ${address}`);
  }
  return hex.padStart(64, "0");
}

function encodeUint256(value: bigint | number | string): string {
  const bn = BigInt(value);
  if (bn < 0n) {
    throw new Error("Uint256 cannot be negative");
  }
  const hex = bn.toString(16);
  if (hex.length > 64) {
    throw new Error("Uint256 value too large");
  }
  return hex.padStart(64, "0");
}

/**
 * Encode asset data the same way as scripts/assets.js:
 * - enc(token) -> ABI-encoded (address)
 * - enc(token, tokenId) -> ABI-encoded (address, uint256)
 */
export function enc(token: string, tokenId?: bigint | number | string): string {
  const addrWord = encodeAddress(token);
  if (tokenId === undefined) {
    return `0x${addrWord}`;
  }
  const idWord = encodeUint256(tokenId);
  return `0x${addrWord}${idWord}`;
}

export const ETH = id("ETH");
export const ERC20 = id("ERC20");
export const ERC721 = id("ERC721");
export const ERC721_LAZY = id("ERC721_LAZY");
export const ERC1155 = id("ERC1155");
export const ERC1155_LAZY = id("ERC1155_LAZY");
export const COLLECTION = id("COLLECTION");
export const CRYPTO_PUNKS = id("CRYPTO_PUNKS");
export const ORDER_DATA_V1 = id("V1");
export const ORDER_DATA_V2 = id("V2");
export const ORDER_DATA_V3 = id("V3");
export const TO_MAKER = id("TO_MAKER");
export const TO_TAKER = id("TO_TAKER");
export const PROTOCOL = id("PROTOCOL");
export const ROYALTY = id("ROYALTY");
export const ORIGIN = id("ORIGIN");
export const PAYOUT = id("PAYOUT");
export const LOCK = id("LOCK");
export const UNLOCK = id("UNLOCK");
export const TO_LOCK = id("TO_LOCK");
