// <ai_context> TypeScript port of scripts/order.js. Exposes helpers to build AssetType, Asset, and Order structs plus an EIP-712 signing helper using Ethers v6, matching the original JS logic.</ai_context>

import type { Signer } from "ethers";

export type AssetTypeStruct = {
  assetClass: string; // bytes4
  data: string; // abi-encoded bytes
};

export type AssetStruct = {
  assetType: AssetTypeStruct;
  value: bigint;
};

export type OrderStruct = {
  maker: string;
  makeAsset: AssetStruct;
  taker: string;
  takeAsset: AssetStruct;
  salt: bigint;
  start: bigint;
  end: bigint;
  dataType: string; // bytes4
  data: string; // bytes
};

export function AssetType(assetClass: string, data: string): AssetTypeStruct {
  return { assetClass, data };
}

export function Asset(assetClass: string, assetData: string, value: bigint | number | string): AssetStruct {
  return {
    assetType: AssetType(assetClass, assetData),
    value: BigInt(value),
  };
}

export function Order(
  maker: string,
  makeAsset: AssetStruct,
  taker: string,
  takeAsset: AssetStruct,
  salt: bigint | number | string,
  start: bigint | number | string,
  end: bigint | number | string,
  dataType: string,
  data: string,
): OrderStruct {
  return {
    maker,
    makeAsset,
    taker,
    takeAsset,
    salt: BigInt(salt),
    start: BigInt(start),
    end: BigInt(end),
    dataType,
    data,
  };
}

export const Types: Record<string, Array<{ name: string; type: string }>> = {
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
 * Sign an order with EIP-712 (Exchange V2 domain) using an Ethers v6 Signer.
 * Mirrors scripts/order.js sign() behavior.
 */
export async function sign(signer: Signer, order: OrderStruct, verifyingContract: string): Promise<string> {
  const network = await signer.provider?.getNetwork();
  const chainId = network?.chainId;
  if (chainId == null) {
    throw new Error("Cannot determine chainId from signer.provider");
  }

  const domain = {
    name: "Exchange",
    version: "2",
    chainId,
    verifyingContract,
  };

  // ethers v6: signTypedData(domain, types, value)
  // Casts keep us independent from TypedData helper types.
  return signer.signTypedData(domain as any, Types as any, order as any);
}
