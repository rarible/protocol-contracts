// <ai_context>
// sdk/supportInterface.ts
// Exports a function that checks if an interface is supported by a contract
// Now updated to remove direct Hardhat references and accept an external signer
// </ai_context>

import { Signer } from "ethers";
import { Ownable__factory } from "../typechain-types";

export interface OwnerParams {
  collectionAddress: string;
  gasLimit?: number;
}

export async function owner(
  signer: Signer,
  params: OwnerParams
): Promise<string> {
  const { collectionAddress, gasLimit = 1_000_000 } = params;

  const ownable = Ownable__factory.connect(collectionAddress, signer);
  const contractOwner = await ownable.owner({ gasLimit });
  return contractOwner;
}