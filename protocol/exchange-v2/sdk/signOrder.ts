import { Signer } from "ethers";
import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { LibOrder } from "@rarible/exchange-v2/typechain-types/contracts/ExchangeV2";

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
 * Creates an EIP-712 signature for a LibOrder.OrderStruct.
 * The domain must match the contract's domain:
 *   - domain.name = "Exchange"
 *   - domain.version = "2"
 *   - domain.verifyingContract = address of the Exchange contract
 */
export async function signOrderEthers(
  order: LibOrder.OrderStruct,
  signer: Signer & TypedDataSigner,
  verifyingContract: string
): Promise<string> {
  // The on-chain code sets domain name "Exchange" and version "2"
  const chainId = await signer.getChainId();
  const domain = {
    name: "Exchange",
    version: "2",
    chainId,
    verifyingContract,
  };

  // Convert numeric fields to string for EIP-712
  const typedData = {
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

  /**
   * The contract calls:
   *   _hashTypedDataV4( keccak256(
   *     abi.encode(
   *       ORDER_TYPEHASH, ...
   *     )
   *   ))
   * plus ECDSA.recover
   * => Provide a typed-data signature for the domain + typedData object
   */
  return signer._signTypedData(domain, Types, typedData);
}