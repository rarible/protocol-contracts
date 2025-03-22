// <ai_context>
// sdk/transferNft.ts
// Exports a function that associates & then transfers a Hedera NFT
// Updated to remove direct Hardhat references and accept external signer
// </ai_context>

import { Signer } from "ethers";
import { IERC721Payble__factory } from "../typechain-types";

export interface ApproveForAllParams {
  tokenAddress: string;
  operator: string;
  gasLimit?: number;
}

export async function approveForAll(
  signer: Signer,
  params: ApproveForAllParams
): Promise<string> {
  const {
    tokenAddress,
    operator,
    gasLimit = 1_000_000,
  } = params;

  const erc721 = IERC721Payble__factory.connect(tokenAddress, signer);
  const tx = await erc721.setApprovalForAll(operator, true, { gasLimit });
  await tx.wait();
  return tx.hash;
}