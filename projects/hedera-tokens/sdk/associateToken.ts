// <ai_context>
// sdk/associateToken.ts
// Exports a function to associate a Hedera token with a designated account.
// </ai_context>

import { ethers } from "hardhat";
import { IHRC719__factory } from "../typechain-types";

export interface AssociateTokenParams {
  tokenAddress: string;
  gasLimit?: number;
  signerIndex?: number;
}

export async function associateToken(params: AssociateTokenParams): Promise<string> {
  const { tokenAddress, gasLimit = 1000000, signerIndex = 1 } = params;
  const signers = await ethers.getSigners();
  const associatingSigner = signers[signerIndex];
  console.log("Using associating signer:", associatingSigner.address);
  console.log("Token to be associated:", tokenAddress);
  const associateTokenInterface = IHRC719__factory.connect(tokenAddress, associatingSigner);
  const tx = await associateTokenInterface.associate({ gasLimit });
  console.log("Association transaction hash:", tx.hash);
  await tx.wait();
  console.log("Token association complete!");
  return tx.hash;
}