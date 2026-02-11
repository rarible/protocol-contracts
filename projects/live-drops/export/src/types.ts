import type { Address } from "viem";

/**
 * Parameters for creating a new LiveDrop collection via the factory.
 * Maps directly to the CollectionConfig struct in LiveDropFactory.sol.
 */
export type CreateDropParams = {
  name: string;
  symbol: string;
  description: string;
  icon: string;
  tokenMetaName: string;
  tokenMetaDescription: string;
  tokenMetaImage: string;
};

/**
 * Result of a successful drop creation, extracted from the CollectionCreated event.
 */
export type DropCreatedResult = {
  collectionAddress: Address;
  creator: Address;
  name: string;
  symbol: string;
  txHash: `0x${string}`;
};

/**
 * Mint currency type
 */
export type MintCurrency = "native" | "erc20";

/**
 * Payload FE sends to BFF when a drop is created
 */
export type ReportDropCreatedPayload = {
  streamId: string;
  collectionAddress: Address;
  creator: Address;
  name: string;
  symbol: string;
  txHash: `0x${string}`;
};

/**
 * Payload FE sends to BFF when a mint is initiated
 */
export type ReportMintPayload = {
  streamId: string;
  collectionAddress: Address;
  minter: Address;
  recipient: Address;
  amount: string; // bigint as string
  currency: MintCurrency;
  txHash: `0x${string}`;
};

/**
 * Mint status tracked in the database
 */
export type MintStatus = "pending" | "success" | "failed";

/**
 * Payload FE sends to BFF to update mint status
 */
export type UpdateMintStatusPayload = {
  txHash: `0x${string}`;
  status: MintStatus;
  tokenId?: string; // bigint as string, present on success
};
