// <ai_context>
// sdk/transferNft.ts
// Exports a function that associates & then transfers a Hedera NFT
// </ai_context>

import { ethers } from "hardhat";
import { IERC721Payble__factory } from "../typechain-types";

export interface ApproveForAllParams {
  tokenAddress: string;
  operator: string;
}

export async function approveForAll(params: ApproveForAllParams): Promise<string> {
  const {
    tokenAddress,
    operator,
  } = params;

  const signers = await ethers.getSigners();
  // We'll assume [0] is deployer, [1] is "receiver" if needed
  const [deployer, receiver] = signers;

  console.log("Using deployer:", deployer.address);

  const erc721 = IERC721Payble__factory.connect(tokenAddress, deployer);

  const approveTx = await erc721.setApprovalForAll(
    operator,
    true,
  );
  await approveTx.wait();

  console.log("approveTx tx hash:", approveTx.hash);
  return approveTx.hash;
}