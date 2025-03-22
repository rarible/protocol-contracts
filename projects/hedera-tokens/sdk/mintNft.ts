// <ai_context>
// sdk/mintNft.ts
// Exports a function that mints an NFT from a precompiled Hedera token
// using the RariNFTCreator contract
// Updated to remove direct Hardhat references
// </ai_context>

import { Signer } from "ethers";
import { RariNFTCreator__factory } from "../typechain-types";

export interface MintNftParams {
  collectionAddress: string;
  gasLimit?: number;
}

export async function mintNft(
  signer: Signer,
  rariNFTCreatorAddress: string,
  params: MintNftParams
): Promise<string> {
  const { collectionAddress, gasLimit = 4_000_000 } = params;
  const fromAddress = await signer.getAddress();

  const rariNFTCreator = RariNFTCreator__factory.connect(rariNFTCreatorAddress, signer);

  const mintTx = await rariNFTCreator.mintNftTo(collectionAddress, fromAddress, { gasLimit });
  await mintTx.wait();

  return mintTx.hash;
}