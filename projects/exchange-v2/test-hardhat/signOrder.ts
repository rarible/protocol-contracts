import { BigNumber, Signer, utils } from "ethers";
import { _TypedDataEncoder } from "@ethersproject/hash";
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
 * The domain must match the contract's domain. 
 */
export async function signOrderEthers(
  order: LibOrder.OrderStruct,
  signer: Signer,
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

  // Encode domain & struct
  const domainSeparator = _TypedDataEncoder.hashDomain(domain);
  const structHash = _TypedDataEncoder.hashStruct("Order", Types, value);

  // The standard EIP-712 message
  const eip712Hash = utils.keccak256(
    utils.concat([
      utils.toUtf8Bytes("\x19\x01"),
      utils.arrayify(domainSeparator),
      utils.arrayify(structHash),
    ])
  );

  // Finally sign the 32-byte EIP-712 hash
  return signer.signMessage(utils.arrayify(eip712Hash));
}