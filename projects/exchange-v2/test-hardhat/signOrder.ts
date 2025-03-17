// signOrder.ts

import { BigNumber, Signer } from "ethers";
import { createTypeData, signTypedData, signTypedData_v4 } from "./EIP712";
import { LibOrder } from "@rarible/exchange-v2/typechain-types/contracts/ExchangeV2";
/**
 * AssetType structure
 */
export interface AssetType {
  assetClass: string; // bytes4
  data: string;       // bytes
}

/**
 * Asset structure
 */
export interface Asset {
  assetType: AssetType;
  value: BigNumber | number | string;
}

/**
 * Order structure
 */
export interface Order {
  maker: string;
  makeAsset: Asset;
  taker: string;
  takeAsset: Asset;
  salt: BigNumber | number | string;
  start: BigNumber | number | string;
  end: BigNumber | number | string;
  dataType: string;   // bytes4
  data: string;       // bytes
}

/**
 * EIP-712 type definitions
 */
const Types = {
  AssetType: [
    { name: "assetClass", type: "bytes4" },
    { name: "data", type: "bytes" },
  ],
  Asset: [
    { name: "assetType", type: "AssetType" },
    { name: "value", type: "uint256" },
  ],
  Order: [
    { name: "maker", type: "address" },
    { name: "makeAsset", type: "Asset" },
    { name: "taker", type: "address" },
    { name: "takeAsset", type: "Asset" },
    { name: "salt", type: "uint256" },
    { name: "start", type: "uint256" },
    { name: "end", type: "uint256" },
    { name: "dataType", type: "bytes4" },
    { name: "data", type: "bytes" },
  ],
};

/**
 * Helper to create an AssetType object
 */
export function createAssetType(assetClass: string, data: string): AssetType {
  return { assetClass, data };
}

/**
 * Helper to create an Asset object
 */
export function createAsset(
  assetClass: string,
  assetData: string,
  value: BigNumber | number | string
): Asset {
  return { assetType: createAssetType(assetClass, assetData), value };
}

/**
 * Helper to create an Order object
 */
export function createOrder(
  maker: string,
  makeAsset: Asset,
  taker: string,
  takeAsset: Asset,
  salt: BigNumber | number | string,
  start: BigNumber | number | string,
  end: BigNumber | number | string,
  dataType: string,
  data: string
): Order {
  return { maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data };
}

/**
 * Signs a given order using EIP-712 typed data
 *
 * @param order - The Order to sign
 * @param account - The signer address
 * @param verifyingContract - The Exchange/Verifying contract address
 * @param web3 - A web3 instance
 */
export async function signOrder(
  order: LibOrder.OrderStruct,
  account: string,
  verifyingContract: string,
  web3: any
): Promise<string> {
  const chainId = Number(await web3.eth.getChainId());
  const dataToSign = createTypeData(
    {
      name: "Exchange",
      version: "2",
      chainId,
      verifyingContract,
    },
    "Order",
    order,
    Types
  );

  // Attempt sign with signTypedData. If older web3 or Metamask doesn't support, fallback to signTypedData_v4
  try {
    const { sig } = await signTypedData(web3, account, dataToSign);
    return sig;
  } catch (error) {
    const { sig } = await signTypedData_v4(web3, account, dataToSign);
    return sig;
  }
}


import { utils } from "ethers";
import { _TypedDataEncoder } from "@ethersproject/hash";

export async function signOrderEthers(
  order: LibOrder.OrderStruct,
  signer: Signer,
  verifyingContract: string
): Promise<string> {
  const chainId = await signer.getChainId();

  // EIP-712 domain
  const domain = {
    name: "Exchange",
    version: "2",
    chainId,
    verifyingContract,
  };

  // Must match the shape you specify in your "types"
  const types = {
    AssetType: [
      { name: "assetClass", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
    Asset: [
      { name: "assetType", type: "AssetType" },
      { name: "value", type: "uint256" },
    ],
    Order: [
      { name: "maker", type: "address" },
      { name: "makeAsset", type: "Asset" },
      { name: "taker", type: "address" },
      { name: "takeAsset", type: "Asset" },
      { name: "salt", type: "uint256" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "dataType", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
  };

  // Values must be strictly typed as strings, numbers, or arrays in the same format that EIP-712 expects
  // Convert BigNumbers to string, etc.
  const value = {
    maker: order.maker,
    makeAsset: {
      assetType: {
        assetClass: order.makeAsset.assetType.assetClass,
        data: order.makeAsset.assetType.data,
      },
      value: order.makeAsset.value.toString(),
    },
    taker: order.taker,
    takeAsset: {
      assetType: {
        assetClass: order.takeAsset.assetType.assetClass,
        data: order.takeAsset.assetType.data,
      },
      value: order.takeAsset.value.toString(),
    },
    salt: order.salt.toString(),
    start: order.start.toString(),
    end: order.end.toString(),
    dataType: order.dataType,
    data: order.data,
  };

  // Compute domain separator + struct hash, then sign the resulting bytes
  const domainSeparator = _TypedDataEncoder.hashDomain(domain);
  const structHash = _TypedDataEncoder.hashStruct("Order", types, value);

  // EIP-712 prefix
  // The final signed hash is keccak256("\x19\x01" + domainSeparator + structHash)
  const eip712Hash = utils.keccak256(
    utils.concat([
      utils.toUtf8Bytes("\x19\x01"),
      utils.arrayify(domainSeparator),
      utils.arrayify(structHash),
    ])
  );

  // Now sign the EIP-712 hash by standard personal signing of those 32 bytes
  const signature = await signer.signMessage(utils.arrayify(eip712Hash));
  return signature;
}