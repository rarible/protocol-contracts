// <ai_context>
// sdk/supportInterface.ts
// Exports a function that checks if an interface is supported by a contract
// Updated to remove direct Hardhat references and accept an external signer
// </ai_context>

import { Signer } from "ethers";
import { IERC721__factory } from "../typechain-types";

export interface SupportInterfaceParams {
  collectionAddress: string;
  interfaceId: string;
  gasLimit?: number;
}

export async function supportInterface(
  signer: Signer,
  params: SupportInterfaceParams
): Promise<boolean> {
  const { collectionAddress, interfaceId, gasLimit = 1_000_000 } = params;

  const erc721 = IERC721__factory.connect(collectionAddress, signer);
  const isSupported = await erc721.supportsInterface(interfaceId, { gasLimit });
  return isSupported;
}