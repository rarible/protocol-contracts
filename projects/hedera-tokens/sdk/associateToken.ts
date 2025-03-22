// <ai_context>
// sdk/associateToken.ts
// Exports a function to associate a Hedera token with a designated account.
// Updated to remove direct Hardhat references and accept an external signer
// </ai_context>

import { Signer } from "ethers";
import { IHRC719__factory } from "../typechain-types";

export interface AssociateTokenParams {
  tokenAddress: string;
  gasLimit?: number;
}

export async function associateToken(
  signer: Signer,
  params: AssociateTokenParams
): Promise<string> {
  const { tokenAddress, gasLimit = 1000000 } = params;

  const associateTokenInterface = IHRC719__factory.connect(tokenAddress, signer);
  const tx = await associateTokenInterface.associate({ gasLimit });
  await tx.wait();

  return tx.hash;
}